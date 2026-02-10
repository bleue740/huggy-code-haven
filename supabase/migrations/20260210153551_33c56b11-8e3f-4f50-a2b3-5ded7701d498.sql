-- Allow users to update their own deployments (needed for upsert)
CREATE POLICY "Users can update their own deployments"
ON public.deployments
FOR UPDATE
USING (auth.uid() = user_id);

-- Remove client-side credit manipulation: revoke UPDATE on users_credits
-- Drop the existing permissive update policy
DROP POLICY IF EXISTS "Users can update their own credits" ON public.users_credits;