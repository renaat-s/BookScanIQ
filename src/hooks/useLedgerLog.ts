import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface LedgerEntry {
  id: string;
  entry_date: string | null;
  month: string;
  type: "income" | "expense" | "uncategorized";
  amount: number;
  vendor: string | null;
  category: string | null;
  document_type: string | null;
  drive_file_id: string | null;
  source: string;
  verified_present: boolean;
  created_at: string;
  currency: string | null;
  exchange_rate: number | null;
}

interface UseLedgerLogOptions {
  autoSync?: boolean;
}

export function useLedgerLog(opts: UseLedgerLogOptions = {}) {
  const { autoSync = true } = opts;
  const { user } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5000);
    setEntries(((data as unknown) as LedgerEntry[]) || []);
    setLoading(false);
  }, [user]);

  const sync = useCallback(
    async (force = false) => {
      if (!user) return;
      setSyncing(true);
      try {
        await supabase.functions.invoke("sync-ledger-log", {
          method: "POST",
          body: { force },
        });
        await fetchEntries();
      } finally {
        setSyncing(false);
      }
    },
    [user, fetchEntries],
  );

  useEffect(() => {
    if (!user) return;
    fetchEntries();
    if (autoSync) {
      // Fire-and-forget background sync; throttled server-side.
      sync(false);
    }
  }, [user, autoSync, fetchEntries, sync]);

  return { entries, loading, syncing, sync, refetch: fetchEntries };
}
