import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewEntry {
  id: string;
  entry_date: string | null;
  month: string;
  type: string;
  amount: number;
  vendor: string | null;
  category: string | null;
  document_type: string | null;
  drive_file_id: string | null;
  review_status: ReviewStatus;
  reviewed_at: string | null;
  review_note: string | null;
  exported_at: string | null;
  created_at: string;
  currency: string | null;
  exchange_rate: number | null;
  original_type: string | null;
}

/**
 * Loads ledger entries by review state and exposes approve / reject actions.
 * Approval is what gates the accounting export in the n8n backend.
 */
export function useReviewQueue() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [queueEnabled, setQueueEnabled] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: rows }, { data: profile }] = await Promise.all([
      supabase
        .from("ledger_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("profiles")
        .select("review_queue_enabled")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setEntries(((rows as unknown) as ReviewEntry[]) || []);
    setQueueEnabled(Boolean(profile?.review_queue_enabled));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const pending = useMemo(
    () => entries.filter((e) => e.review_status === "pending"),
    [entries],
  );
  const approved = useMemo(
    () => entries.filter((e) => e.review_status === "approved"),
    [entries],
  );
  const rejected = useMemo(
    () => entries.filter((e) => e.review_status === "rejected"),
    [entries],
  );

  const setStatus = useCallback(
    async (ids: string[], status: ReviewStatus, note?: string) => {
      if (!user || ids.length === 0) return;
      setWorking(true);
      const previous = entries;
      setEntries((prev) =>
        prev.map((e) =>
          ids.includes(e.id)
            ? { ...e, review_status: status, reviewed_at: new Date().toISOString(), review_note: note ?? e.review_note }
            : e,
        ),
      );
      const patch = { review_status: status, ...(note !== undefined ? { review_note: note } : {}) };
      const { error } = await supabase
        .from("ledger_entries")
        .update(patch)
        .eq("user_id", user.id)
        .in("id", ids);
      if (error) setEntries(previous);
      setWorking(false);
    },
    [user, entries],
  );

  /** Re-classify an uncategorized entry as income or expense. */
  const setEntryType = useCallback(
    async (id: string, type: "income" | "expense") => {
      if (!user) return;
      setWorking(true);
      const previous = entries;
      const current = entries.find((e) => e.id === id);
      const originalType = current?.original_type ?? current?.type ?? null;
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, type, original_type: originalType } : e)),
      );
      const { error } = await supabase
        .from("ledger_entries")
        .update({ type, original_type: originalType })
        .eq("user_id", user.id)
        .eq("id", id);
      if (error) setEntries(previous);
      setWorking(false);
    },
    [user, entries],
  );

  /**
   * Send rejected entries back to Pending and revert their designation to the
   * original one captured before any re-classification.
   */
  const restoreEntries = useCallback(
    async (ids: string[]) => {
      if (!user || ids.length === 0) return;
      setWorking(true);
      const previous = entries;
      const targets = entries.filter((e) => ids.includes(e.id));
      setEntries((prev) =>
        prev.map((e) =>
          ids.includes(e.id)
            ? {
                ...e,
                review_status: "pending" as ReviewStatus,
                reviewed_at: null,
                type: e.original_type ?? e.type,
              }
            : e,
        ),
      );
      const results = await Promise.all(
        targets.map((e) =>
          supabase
            .from("ledger_entries")
            .update({
              review_status: "pending",
              reviewed_at: null,
              type: e.original_type ?? e.type,
            })
            .eq("user_id", user.id)
            .eq("id", e.id),
        ),
      );
      if (results.some((r) => r.error)) setEntries(previous);
      setWorking(false);
    },
    [user, entries],
  );

  const toggleQueue = useCallback(
    async (enabled: boolean) => {
      if (!user) return;
      setQueueEnabled(enabled);
      const { error } = await supabase
        .from("profiles")
        .update({ review_queue_enabled: enabled })
        .eq("user_id", user.id);
      if (error) setQueueEnabled(!enabled);
    },
    [user],
  );

  return {
    entries,
    pending,
    approved,
    rejected,
    loading,
    working,
    queueEnabled,
    toggleQueue,
    setStatus,
    setEntryType,
    refetch: fetchAll,
  };
}
