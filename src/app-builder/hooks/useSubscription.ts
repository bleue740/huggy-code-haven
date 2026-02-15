import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionState {
  plan: string;
  status: string;
  creditTier: number;
  billingPeriod: 'monthly' | 'annual';
  monthlyCredits: number;
  currentPeriodEnd: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    plan: 'free',
    status: 'active',
    creditTier: 0,
    billingPeriod: 'monthly',
    monthlyCredits: 0,
    currentPeriodEnd: null,
    isLoading: true,
    error: null,
  });

  const fetchSubscription = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const { data: sub, error: fetchErr } = await supabase
        .from('subscriptions')
        .select('plan, status, credit_tier, billing_period, monthly_credits, current_period_end')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (sub) {
        setState({
          plan: (sub as any).plan ?? 'free',
          status: (sub as any).status ?? 'active',
          creditTier: (sub as any).credit_tier ?? 0,
          billingPeriod: (sub as any).billing_period ?? 'monthly',
          monthlyCredits: (sub as any).monthly_credits ?? 0,
          currentPeriodEnd: (sub as any).current_period_end,
          isLoading: false,
          error: null,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (e: any) {
      console.error('Failed to fetch subscription:', e);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: e?.message ?? 'Failed to load subscription',
      }));
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    ...state,
    isPro: state.plan === 'pro' && state.status === 'active',
    isBusiness: state.plan === 'business' && state.status === 'active',
    isPaid: ['pro', 'business'].includes(state.plan) && state.status === 'active',
    refetch: fetchSubscription,
  };
}
