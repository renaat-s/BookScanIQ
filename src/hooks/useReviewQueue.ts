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
      const patch: Record<string, unknown> = { review_status: status };
      if (note !== undefined) patch.review_note = note;
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
    refetch: fetchAll,
  };
}
