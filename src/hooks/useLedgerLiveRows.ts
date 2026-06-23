import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LedgerEntry {
  rowIndex: number;
  vendor: string;
  total: string;
  totalNumeric: number;
  type: string;
  date: string;
  link: string | null;
  driveId: string | null;
  raw: Record<string, string>;
}

const DRIVE_ID_RX = /[-\w]{25,}/;

function extractDriveId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(DRIVE_ID_RX);
  return m ? m[0] : null;
}

function parseAmount(v: string): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function findCol(header: string[], keywords: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const h = (header[i] || "").toLowerCase();
    if (keywords.some((k) => h.includes(k))) return i;
  }
  return -1;
}

interface SheetResp {
  spreadsheet: { id: string; title: string; url: string };
  tabs: { title: string }[];
  active: { title: string } | null;
  values: string[][];
}

/**
 * Reads the current rows from the user's Live Workspace ledger (Transactions tab)
 * and normalises them into a friendly shape for the Documents/Vendors tabs.
 */
export function useLedgerLiveRows() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try the Transactions tab first; fall back to whatever the function returns.
      const { data, error } = await supabase.functions.invoke("sheet-read", {
        body: { sheetName: "Transactions" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const resp = data as SheetResp;
      const values = resp.values ?? [];
      if (values.length < 2) {
        setEntries([]);
        return;
      }
      const header = values[0].map((h) => (h ?? "").toString());
      const vendorIdx = findCol(header, ["vendor", "merchant", "supplier", "payee"]);
      const totalIdx = findCol(header, ["total", "amount", "gross"]);
      const typeIdx = findCol(header, ["type", "direction", "flow"]);
      const dateIdx = findCol(header, ["date"]);
      const linkIdx = findCol(header, ["link", "url", "drive", "document"]);

      const parsed: LedgerEntry[] = [];
      for (let r = 1; r < values.length; r++) {
        const row = values[r] ?? [];
        const get = (i: number) => (i >= 0 ? (row[i] ?? "").toString().trim() : "");

        // If no explicit link column, try to find any URL cell in the row.
        let link = linkIdx >= 0 ? get(linkIdx) : "";
        if (!link) {
          const urlCell = row.find((c) => typeof c === "string" && /^https?:\/\//i.test(c));
          if (urlCell) link = urlCell.trim();
        }

        const vendor = get(vendorIdx);
        const total = get(totalIdx);
        // Skip totally empty rows
        if (!vendor && !total && !link) continue;

        parsed.push({
          rowIndex: r,
          vendor: vendor || "Unknown vendor",
          total,
          totalNumeric: parseAmount(total),
          type: get(typeIdx),
          date: get(dateIdx),
          link: link || null,
          driveId: extractDriveId(link || null),
          raw: header.reduce<Record<string, string>>((acc, h, i) => {
            acc[h || `col_${i}`] = (row[i] ?? "").toString();
            return acc;
          }, {}),
        });
      }
      setEntries(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ledger");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, error, reload: load };
}
