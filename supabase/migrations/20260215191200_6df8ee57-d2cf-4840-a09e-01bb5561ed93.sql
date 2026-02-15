
-- =============================================
-- 1. credit_transactions: audit trail complet
-- =============================================
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deduction', 'monthly_grant', 'daily_grant', 'topup', 'upgrade_adjustment', 'refund')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only edge functions (service role) insert transactions, but we allow user insert for safety
CREATE POLICY "Users can insert their own transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions (user_id);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions (type);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions (created_at DESC);

-- =============================================
-- 2. Enrich subscriptions table
-- =============================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS credit_tier INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_granted_at TIMESTAMP WITH TIME ZONE;

-- =============================================
-- 3. Enrich users_credits with daily tracking
-- =============================================
ALTER TABLE public.users_credits
  ADD COLUMN IF NOT EXISTS daily_credits NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS monthly_credits NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS topup_credits NUMERIC DEFAULT 0;

-- =============================================
-- 4. DB function: safe credit deduction with transaction logging
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current NUMERIC;
  v_new NUMERIC;
  v_result JSONB;
BEGIN
  -- Lock the row
  SELECT credits INTO v_current
  FROM users_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_credit_row');
  END IF;

  IF v_current < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits', 'current', v_current, 'required', p_amount);
  END IF;

  v_new := v_current - p_amount;

  UPDATE users_credits
  SET credits = v_new,
      lifetime_used = lifetime_used + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (p_user_id, 'deduction', -p_amount, v_new, p_description, p_metadata);

  RETURN jsonb_build_object('success', true, 'remaining', v_new, 'deducted', p_amount);
END;
$$;

-- =============================================
-- 5. DB function: grant daily credits
-- =============================================
CREATE OR REPLACE FUNCTION public.grant_daily_credits(
  p_user_id UUID,
  p_amount NUMERIC DEFAULT 5
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_reset TIMESTAMP WITH TIME ZONE;
  v_new_balance NUMERIC;
BEGIN
  SELECT daily_credits_reset_at, credits INTO v_last_reset, v_new_balance
  FROM users_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_last_reset IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_credit_row');
  END IF;

  -- Already granted today
  IF v_last_reset::date = now()::date THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_granted_today');
  END IF;

  v_new_balance := v_new_balance + p_amount;

  UPDATE users_credits
  SET credits = v_new_balance,
      daily_credits = p_amount,
      daily_credits_reset_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
  VALUES (p_user_id, 'daily_grant', p_amount, v_new_balance, 'Daily credit grant: ' || p_amount);

  RETURN jsonb_build_object('success', true, 'granted', p_amount, 'new_balance', v_new_balance);
END;
$$;

-- =============================================
-- 6. DB function: grant monthly credits (on subscription renewal)
-- =============================================
CREATE OR REPLACE FUNCTION public.grant_monthly_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_plan TEXT DEFAULT 'pro'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  SELECT credits INTO v_new_balance
  FROM users_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_new_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_credit_row');
  END IF;

  v_new_balance := v_new_balance + p_amount;

  UPDATE users_credits
  SET credits = v_new_balance,
      monthly_credits = p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Update subscription
  UPDATE subscriptions
  SET monthly_credits = p_amount::INTEGER,
      credits_granted_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id AND status = 'active';

  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (p_user_id, 'monthly_grant', p_amount, v_new_balance, 'Monthly credit grant: ' || p_amount, jsonb_build_object('plan', p_plan));

  RETURN jsonb_build_object('success', true, 'granted', p_amount, 'new_balance', v_new_balance);
END;
$$;
