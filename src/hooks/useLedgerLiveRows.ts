import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LedgerEntry {
  entryNumber: number;
  sheetRowNumber: number;
  vendor: string;
  total: string;
  totalNumeric: number;
  type: string;
  date: string;
  link: string | null;
  driveId: string | null;
  raw: Record<string, string>;
}

export interface LedgerSource {
  tabTitle: string | null;
  rowCount: number;
  parsedCount: number;
  documentLinkCount: number;
  fallbackUsed: boolean;
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

function normalizeHeader(v: string): string {
  return (v || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findCol(header: string[], keywords: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const h = normalizeHeader(header[i] || "");
    if (keywords.some((k) => h.includes(k))) return i;
  }
  return -1;
}

function findHeaderRow(values: string[][]): number {
  const maxRows = Math.min(values.length, 25);
  let best = 0;
  let bestScore = -1;

  for (let i = 0; i < maxRows; i++) {
    const row = values[i] ?? [];
    const normalized = row.map((c) => normalizeHeader((c ?? "").toString()));
    const score = [
      normalized.some((h) => ["vendor", "merchant", "supplier", "payee", "description", "contact", "name"].some((k) => h.includes(k))),
      normalized.some((h) => ["total", "amount", "gross", "value", "debit", "credit"].some((k) => h.includes(k))),
      normalized.some((h) => ["link", "url", "drive", "document", "preview", "file", "receipt", "invoice"].some((k) => h.includes(k))),
      normalized.some((h) => h === "date" || h.includes("date")),
      normalized.some((h) => ["type", "direction", "flow", "income", "expense"].some((k) => h.includes(k))),
    ].filter(Boolean).length;

    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
    if (score >= 3) break;
  }

  return best;
}

function extractHyperlinkUrl(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^=HYPERLINK\(\s*"([^"]+)"/i) || value.match(/^=HYPERLINK\(\s*'([^']+)'/i);
  return match?.[1] || null;
}

function firstUrlFromRow(row: string[]): string {
  for (const cell of row) {
    const value = (cell ?? "").toString().trim();
    const hyperlink = extractHyperlinkUrl(value);
    if (hyperlink) return hyperlink;
    const url = value.match(/https?:\/\/[^\s"')]+/i)?.[0];
    if (url) return url;
  }
  return "";
}

function isLikelyLinkHeader(h: string): boolean {
  const normalized = normalizeHeader(h);
  return ["link", "url", "drive", "document", "preview", "file", "receipt", "invoice"].some((k) => normalized.includes(k));
}

interface SheetResp {
  spreadsheet: { id: string; title: string; url: string };
  tabs: { title: string }[];
  active: { title: string } | null;
  values: string[][];
  formulaValues?: string[][];
  cellLinks?: (string | null)[][];
}

interface ParsedSheet {
  entries: LedgerEntry[];
  source: LedgerSource;
}

function parseSheet(resp: SheetResp, fallbackUsed = false): ParsedSheet {
  const values = resp.values ?? [];
  const sourceBase = {
    tabTitle: resp.active?.title ?? null,
    rowCount: Math.max(0, values.length - 1),
    fallbackUsed,
  };

  if (values.length < 2) {
    return {
      entries: [],
      source: { ...sourceBase, parsedCount: 0, documentLinkCount: 0 },
    };
  }

  const formulaValues = resp.formulaValues ?? [];
  const cellLinks = resp.cellLinks ?? [];
  const headerRow = findHeaderRow(values);
  const header = values[headerRow].map((h) => (h ?? "").toString());
  const vendorIdx = findCol(header, ["vendor", "merchant", "supplier", "payee", "description", "contact", "name"]);
  const totalIdx = findCol(header, ["total", "amount", "gross", "value", "debit", "credit"]);
  const typeIdx = findCol(header, ["type", "direction", "flow"]);
  const dateIdx = findCol(header, ["date"]);
  const linkIdx = header.findIndex(isLikelyLinkHeader);

  const parsed: LedgerEntry[] = [];
  for (let r = headerRow + 1; r < values.length; r++) {
    const row = values[r] ?? [];
    const formulaRow = formulaValues[r] ?? [];
    const linkRow = cellLinks[r] ?? [];
    const get = (i: number) => (i >= 0 ? (row[i] ?? "").toString().trim() : "");

    // Prefer hidden/cell-level URLs, then =HYPERLINK formulas, then visible URLs.
    let link = linkIdx >= 0 ? (linkRow[linkIdx] || extractHyperlinkUrl(formulaRow[linkIdx]) || get(linkIdx) || "") : "";
    if (!/^https?:\/\//i.test(link)) link = "";
    if (!link) link = linkRow.find((v) => typeof v === "string" && /^https?:\/\//i.test(v)) || "";
    if (!link) link = firstUrlFromRow(formulaRow);
    if (!link) link = firstUrlFromRow(row);

    const vendor = get(vendorIdx);
    const total = get(totalIdx);
    // Skip totally empty rows.
    if (!vendor && !total && !link) continue;

    parsed.push({
      entryNumber: parsed.length + 1,
      sheetRowNumber: r + 1,
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

  return {
    entries: parsed,
    source: {
      ...sourceBase,
      rowCount: Math.max(0, values.length - headerRow - 1),
      parsedCount: parsed.length,
      documentLinkCount: parsed.filter((e) => e.link || e.driveId).length,
    },
  };
}

/**
 * Reads the current rows from the user's Live Workspace ledger and normalises
 * them into a friendly shape for the Documents/Vendors tabs.
 */
export function useLedgerLiveRows() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<LedgerSource | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const readSheet = async (body: Record<string, string>) => {
        const { data, error } = await supabase.functions.invoke("sheet-read", { body });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data as SheetResp;
      };

      const primaryResp = await readSheet({ sheetName: "Transactions" });
      let result = parseSheet(primaryResp);

      // Deep-audit finding: the visible Live Workspace ledger uses the default
      // sheet when no tab is selected, while this hook used to hard-code the
      // Transactions tab. If a workspace has rows in the default ledger tab but
      // an empty/renamed Transactions tab, Documents/Vendors looked empty even
      // though the Ledger sub-tab showed data. Fall back to the same default tab
      // only when the Transactions attempt produced no parseable entries.
      if (result.entries.length === 0) {
        const fallbackResp = await readSheet({});
        const fallback = parseSheet(fallbackResp, true);
        if (fallback.entries.length > result.entries.length) {
          result = fallback;
        }
      }

      setEntries(result.entries);
      setSource(result.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ledger");
      setEntries([]);
      setSource(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, error, reload: load, source };
}
