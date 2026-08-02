import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLedgerLog } from "@/hooks/useLedgerLog";
import {
  findAnomalies,
  findDuplicates,
  withinLastMonths,
  type DetectedAlert,
} from "@/lib/anomaly-detection";

export function useAlerts() {
  const { user } = useAuth();
  const { entries, loading: ledgerLoading, refetch } = useLedgerLog({ autoSync: false });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [dismissLoading, setDismissLoading] = useState(true);

  const fetchDismissals = useCallback(async () => {
    if (!user) {
      setDismissed(new Set());
      setDismissLoading(false);
      return;
    }
    setDismissLoading(true);
    const { data } = await supabase
      .from("alert_dismissals")
      .select("alert_key")
      .eq("user_id", user.id);
    setDismissed(new Set((data || []).map((r: { alert_key: string }) => r.alert_key)));
    setDismissLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDismissals();
  }, [fetchDismissals]);

  const { duplicates, anomalies } = useMemo(() => {
    const recent = withinLastMonths(entries, 6);
    return {
      duplicates: findDuplicates(recent).filter((a) => !dismissed.has(a.key)),
      anomalies: findAnomalies(recent).filter((a) => !dismissed.has(a.key)),
    };
  }, [entries, dismissed]);

  const dismiss = useCallback(
    async (alert: DetectedAlert) => {
      if (!user) return;
      setDismissed((prev) => new Set(prev).add(alert.key));
      const { error } = await supabase
        .from("alert_dismissals")
        .insert({ user_id: user.id, alert_key: alert.key });
      if (error && error.code !== "23505") {
        // Roll back the optimistic hide if the write genuinely failed.
        setDismissed((prev) => {
          const next = new Set(prev);
          next.delete(alert.key);
          return next;
        });
      }
    },
    [user],
  );

  const restoreAll = useCallback(async () => {
    if (!user) return;
    await supabase.from("alert_dismissals").delete().eq("user_id", user.id);
    setDismissed(new Set());
  }, [user]);

  return {
    duplicates,
    anomalies,
    total: duplicates.length + anomalies.length,
    dismissedCount: dismissed.size,
    loading: ledgerLoading || dismissLoading,
    dismiss,
    restoreAll,
    refetch,
  };
}
