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

  const useCredits = useCallback(async (amount: number = 1): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return false;

      if (state.credits < amount) {
        return false;
      }

      const { data: updated, error } = await supabase
        .from('users_credits')
        .update({
          credits: state.credits - amount,
          lifetime_used: state.lifetimeUsed + amount,
        })
        .eq('user_id', userId)
        .select('credits, lifetime_used')
        .single();

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        credits: (updated as any).credits,
        lifetimeUsed: (updated as any).lifetime_used,
      }));

      return true;
    } catch (e: any) {
      console.error('Failed to use credits:', e);
      return false;
    }
  }, [state.credits, state.lifetimeUsed]);

  const addCredits = useCallback(async (amount: number): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return false;

      const { data: updated, error } = await supabase
        .from('users_credits')
        .update({ credits: state.credits + amount })
        .eq('user_id', userId)
        .select('credits, lifetime_used')
        .single();

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        credits: (updated as any).credits,
      }));

      return true;
    } catch (e: any) {
      console.error('Failed to add credits:', e);
      return false;
    }
  }, [state.credits]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    ...state,
    useCredits,
    addCredits,
    refetch: fetchCredits,
  };
}
