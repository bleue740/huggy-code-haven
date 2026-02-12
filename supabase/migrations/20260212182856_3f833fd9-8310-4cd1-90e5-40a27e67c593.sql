-- Add RLS UPDATE policy on users_credits so service role or user can update credits
CREATE POLICY "Users can update their own credits"
ON public.users_credits
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);