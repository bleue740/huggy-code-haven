import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export function useCreditTransactions(limit = 50) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) { setIsLoading(false); return; }

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('id, type, amount, balance_after, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTransactions((data as any[]) ?? []);
    } catch (e) {
      console.error('Failed to fetch credit transactions:', e);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { transactions, isLoading, refetch: fetch };
}
