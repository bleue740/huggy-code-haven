import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreditsState {
  credits: number;
  lifetimeUsed: number;
  dailyCredits: number;
  monthlyCredits: number;
  topupCredits: number;
  dailyCreditsResetAt: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useCredits() {
  const [state, setState] = useState<CreditsState>({
    credits: 0,
    lifetimeUsed: 0,
    dailyCredits: 0,
    monthlyCredits: 0,
    topupCredits: 0,
    dailyCreditsResetAt: null,
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
        .select('credits, lifetime_used, daily_credits, monthly_credits, topup_credits, daily_credits_reset_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing) {
        setState({
          credits: (existing as any).credits,
          lifetimeUsed: (existing as any).lifetime_used,
          dailyCredits: (existing as any).daily_credits ?? 0,
          monthlyCredits: (existing as any).monthly_credits ?? 0,
          topupCredits: (existing as any).topup_credits ?? 0,
          dailyCreditsResetAt: (existing as any).daily_credits_reset_at,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Initialize credits for new users
      const { data: inserted, error: insertErr } = await supabase
        .from('users_credits')
        .insert({ user_id: userId, credits: 100, lifetime_used: 0 })
        .select('credits, lifetime_used')
        .single();

      if (insertErr) throw insertErr;

      setState({
        credits: (inserted as any).credits,
        lifetimeUsed: (inserted as any).lifetime_used,
        dailyCredits: 0,
        monthlyCredits: 0,
        topupCredits: 0,
        dailyCreditsResetAt: null,
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

  return {
    ...state,
    refetch: fetchCredits,
  };
}
