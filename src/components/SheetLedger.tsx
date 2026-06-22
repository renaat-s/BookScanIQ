import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2, RefreshCw, ExternalLink, AlertCircle, Search,
  FileSpreadsheet, ChevronLeft, ChevronRight,
} from "lucide-react";
import DriveLinkPreview, { isUrl, extractDriveId } from "./DriveLinkPreview";

interface SheetTab {
  sheetId: number;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
}

interface SheetResp {
  spreadsheet: { id: string; title: string; url: string };
  tabs: SheetTab[];
  active: SheetTab | null;
  values: string[][];
}

const PAGE_SIZE = 25;

// Heuristics: detect money / date / status cells for nicer rendering
const moneyRx = /^-?[$€£¥]?\s?-?\d[\d,]*\.?\d*\s?(USD|EUR|GBP|CAD|AUD)?$/i;
const isMoney = (v: string) => !!v && moneyRx.test(v.trim()) && /[\d.]/.test(v);
const statusColor = (v: string) => {
  const s = v.trim().toLowerCase();
  if (!s) return "";
  if (["paid", "synced", "success", "done", "complete", "completed"].includes(s))
    return "bg-success/15 text-success border-success/30";
  if (["pending", "processing", "in progress", "syncing"].some((x) => s.includes(x)))
    return "bg-accent/15 text-accent border-accent/30";
  if (["failed", "error", "overdue", "rejected"].some((x) => s.includes(x)))
    return "bg-destructive/15 text-destructive border-destructive/30";
  if (["draft", "uncategorized"].some((x) => s.includes(x)))
    return "bg-muted text-muted-foreground border-border";
  return "";
};

// Detect income/expense type cells for green/red styling
const detectType = (val: string): "income" | "expense" | null => {
  const s = (val ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s === "income" || s.includes("↗") || s === "credit" || s === "revenue" || s === "in") return "income";
  if (s === "expense" || s.includes("↘") || s === "debit" || s === "cost" || s === "out") return "expense";
  return null;
};

const SheetLedger = () => {
  const [data, setData] = useState<SheetResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(async (sheetName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("sheet-read", {
        body: sheetName ? { sheetName } : {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setData(data as SheetResp);
      setActiveTab((prev) => prev ?? (data?.active?.title as string | undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab);
  }, [activeTab, load]);

  const header = data?.values?.[0] ?? [];
  const rows = useMemo(() => data?.values?.slice(1) ?? [], [data]);

  // Precompute per-column heuristics once per header change (was O(rows × cols) per render).
  const colMeta = useMemo(
    () =>
      header.map((h) => {
        const name = (h ?? "").toLowerCase();
        return {
          looksMoneyByHeader: ["total", "amount", "balance", "tax", "subtotal", "due"].some((k) =>
            name.includes(k),
          ),
          looksStatus: ["status", "state"].some((k) => name.includes(k)),
          looksType: ["type", "direction", "flow"].some((k) => name.includes(k)),
        };
      }),
    [header],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.some((c) => (c ?? "").toLowerCase().includes(q)));
  }, [rows, query]);

  useEffect(() => setPage(0), [query, activeTab]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live · InvoiceIQ Ledger
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm" className="gap-1.5"
            onClick={() => load(activeTab)} disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {data?.spreadsheet?.url && (
            <a href={data.spreadsheet.url} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm" className="gap-1.5">
                Open in Sheets <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center gap-2 flex-wrap p-2 rounded-lg bg-muted/40 border border-border/60">
        <FileSpreadsheet className="w-4 h-4 text-success shrink-0 ml-1" />
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {(data?.tabs ?? []).map((t) => {
            const isActive = (activeTab ?? data?.active?.title) === t.title;
            return (
              <button
                key={t.sheetId}
                onClick={() => setActiveTab(t.title)}
                className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.title}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rows"
            className="h-8 pl-7 w-44 text-xs"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-xl border border-border/60 overflow-hidden bg-background/40">
        {loading && !data ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : !data || rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {data ? "No rows yet in this tab." : "Ledger is empty."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 backdrop-blur sticky top-0 z-10">
                <tr className="border-b border-border/60">
                  <th className="px-3 py-2 text-center text-[11px] uppercase tracking-wider text-muted-foreground font-semibold w-10">
                    #
                  </th>
                  {header.map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-center text-[11px] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap"
                    >
                      {h || `Col ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pageRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground tabular-nums">
                      {page * PAGE_SIZE + ri + 1}
                    </td>
                    {header.map((_, ci) => {
                      const val = row[ci] ?? "";
                      const meta = colMeta[ci];
                      const looksMoney = meta.looksMoneyByHeader || isMoney(val);
                      const looksStatus = meta.looksStatus;
                      const txnType = meta.looksType ? detectType(val) : null;
                      const chipCls = looksStatus ? statusColor(val) : "";
                      return (
                        <td
                          key={ci}
                          className={`px-3 py-2 align-middle text-center whitespace-nowrap ${
                            looksMoney ? "font-semibold tabular-nums" : ""
                          }`}
                        >
                          {txnType ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                                txnType === "income"
                                  ? "bg-success/15 text-success border-success/30"
                                  : "bg-destructive/15 text-destructive border-destructive/30"
                              }`}
                            >
                              {txnType === "income" ? "↗ Income" : "↘ Expense"}
                            </span>
                          ) : looksStatus && val ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${
                                chipCls || "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {val}
                            </span>
                          ) : isUrl(val) ? (
                            <DriveLinkPreview
                              url={val.trim()}
                              label={extractDriveId(val) ? "Open document" : val.trim()}
                            />
                          ) : (
                            <span className={looksMoney ? "text-foreground" : "text-foreground/90"}>
                              {val || <span className="text-muted-foreground">—</span>}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <span className="text-foreground font-medium">{page * PAGE_SIZE + 1}</span>–
            <span className="text-foreground font-medium">
              {Math.min((page + 1) * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="text-foreground font-medium">{filtered.length}</span> rows
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="sm" className="h-7 px-2"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="tabular-nums">
              {page + 1} / {pageCount}
            </span>
            <Button
              variant="ghost" size="sm" className="h-7 px-2"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Live · Streamed from your InvoiceIQ Ledger. Switch tabs, search, and paginate without leaving the dashboard.
      </p>
    </div>
  );
};

export default SheetLedger;
