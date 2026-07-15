import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getScanCap } from '@/lib/stripe-plans';

/**
 * A "scan" = one backlog scan job OR one manual upload (an invoice with no
 * scan_job_id). Counted per calendar month for the current user.
 */
export interface ScanUsage {
  used: number;
  cap: number | null; // null = unlimited
  percent: number; // 0 when unlimited
  nearCap: boolean; // >= 80% and finite cap
  atCap: boolean; // >= 100% and finite cap
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useScanUsage(): ScanUsage {
  const { user, subscription } = useAuth();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const cap = subscription.isDeveloper ? null : getScanCap(subscription.tier);

  const refresh = useCallback(async () => {
    if (!user) {
      setUsed(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [scansRes, uploadsRes] = await Promise.all([
      supabase
        .from('scan_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start),
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('scan_job_id', null)
        .gte('created_at', start),
    ]);

    const total = (scansRes.count ?? 0) + (uploadsRes.count ?? 0);
    setUsed(total);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const percent = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  const atCap = cap !== null && used >= cap;
  const nearCap = cap !== null && used / cap >= 0.8;

  return { used, cap, percent, nearCap, atCap, loading, refresh };
}
