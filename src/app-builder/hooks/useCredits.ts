import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreditsState {
  credits: number;
  lifetimeUsed: number;
  isLoading: boolean;
  error: string | null;
}

export function useCredits() {
  const [state, setState] = useState<CreditsState>({
    credits: 0,
    lifetimeUsed: 0,
    isLoading: true,
    error: null,
  });

  const fetchCredits = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const { data: existing, error: fetchErr } = await supabase
        .from('users_credits')
        .select('credits, lifetime_used')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing) {
        setState({
          credits: (existing as any).credits,
          lifetimeUsed: (existing as any).lifetime_used,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Initialize credits for new users (insert only, no update capability)
      const { data: inserted, error: insertErr } = await supabase
        .from('users_credits')
        .insert({ user_id: userId, credits: 100, lifetime_used: 0 })
        .select('credits, lifetime_used')
        .single();

      if (insertErr) throw insertErr;

      setState({
        credits: (inserted as any).credits,
        lifetimeUsed: (inserted as any).lifetime_used,
        isLoading: false,
        error: null,
      });
    } catch (e: any) {
      console.error('Failed to fetch credits:', e);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: e?.message ?? 'Failed to load credits',
      }));
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Read-only hook: credits are deducted server-side in the ai-chat edge function.
  // No useCredits() or addCredits() methods exposed — prevents client-side manipulation.
  return {
    ...state,
    refetch: fetchCredits,
  };
}
