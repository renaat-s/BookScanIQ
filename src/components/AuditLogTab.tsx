import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ScanLine, FileCheck2, AlertCircle, Plug, Settings as SettingsIcon,
  Download, Loader2, ShieldCheck, Search, RefreshCw, Sparkles, Receipt, Trash2,
  BookOpen,
} from "lucide-react";
import { useLedgerLog } from "@/hooks/useLedgerLog";

type FeedItem = {
  id: string;
  at: string; // ISO
  type: string;
  title: string;
  detail?: string;
  reasoning?: string;
  source: "audit" | "scan" | "invoice";
};

const iconFor = (type: string) => {
  if (type.startsWith("scan_started")) return <ScanLine className="w-4 h-4" />;
  if (type.startsWith("scan_completed")) return <FileCheck2 className="w-4 h-4" />;
  if (type.startsWith("scan_failed")) return <AlertCircle className="w-4 h-4" />;
  if (type.startsWith("invoice_synced")) return <RefreshCw className="w-4 h-4" />;
  if (type.startsWith("invoice_categorized")) return <Sparkles className="w-4 h-4" />;
  if (type.startsWith("invoice_detected")) return <Receipt className="w-4 h-4" />;
  if (type.startsWith("workspace")) return <Plug className="w-4 h-4" />;
  if (type.startsWith("settings")) return <SettingsIcon className="w-4 h-4" />;
  if (type.startsWith("data_exported")) return <Download className="w-4 h-4" />;
  return <ShieldCheck className="w-4 h-4" />;
};

const labelFor = (type: string) => type.replace(/_/g, " ");

const AuditLogTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [query, setQuery] = useState("");
  const [clearing, setClearing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [auditRes, scanRes, invRes] = await Promise.all([
        supabase
          .from("audit_events")
          .select("id, event_type, message, reasoning, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("scan_jobs")
          .select("id, status, created_at, updated_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("invoices")
          .select("id, invoice_vendor, invoice_total, invoice_category, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (cancelled) return;

      const feed: FeedItem[] = [];

      (auditRes.data || []).forEach((e: any) => {
        feed.push({
          id: `a-${e.id}`,
          at: e.created_at,
          type: e.event_type,
          title: e.message,
          reasoning: e.reasoning ?? undefined,
          source: "audit",
        });
      });

      (scanRes.data || []).forEach((s: any) => {
        const t = s.status === "failed" ? "scan_failed"
          : s.status === "completed" ? "scan_completed"
          : "scan_started";
        feed.push({
          id: `s-${s.id}`,
          at: s.updated_at || s.created_at,
          type: t,
          title:
            t === "scan_failed" ? "Scan failed"
            : t === "scan_completed" ? "Scan completed"
            : "Scan started",
          detail: `Job ${String(s.id).slice(0, 8)}, status: ${s.status}`,
          source: "scan",
        });
      });

      (invRes.data || []).forEach((i: any) => {
        feed.push({
          id: `i-${i.id}`,
          at: i.created_at,
          type: "invoice_detected",
          title: `Invoice processed: ${i.invoice_vendor || "Unknown vendor"}`,
          detail: [
            i.invoice_total ? `Total ${i.invoice_total}` : null,
            i.invoice_category ? `Category: ${i.invoice_category}` : null,
          ].filter(Boolean).join(" · "),
          source: "invoice",
        });
      });

      feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setItems(feed);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, reloadKey]);

  const handleClear = async () => {
    if (!user) return;
    setClearing(true);
    const { error } = await supabase
      .from("audit_events")
      .delete()
      .eq("user_id", user.id);
    setClearing(false);
    if (error) {
      toast({ title: "Couldn't clear log", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Audit log cleared", description: "Past audit events were removed. Scans and invoices are kept." });
    setReloadKey((k) => k + 1);
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.detail?.toLowerCase().includes(q) ||
        it.reasoning?.toLowerCase().includes(q) ||
        it.type.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="space-y-6">
      <LedgerLogCard />
      <Card className="border-border/60">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Audit Log
            </CardTitle>
            <CardDescription>
              Every action InvoiceIQ takes on your data, in plain English. You can clear past entries below, scans and invoices are kept intact.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events…"
                className="pl-9"
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={clearing || items.filter((i) => i.source === "audit").length === 0}
                  className="shrink-0"
                >
                  {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span className="ml-2 hidden sm:inline">Clear log</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear audit log?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes every recorded audit event for your account. Scan jobs and processed invoices stay intact, only the activity trail is wiped. This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear}>Clear log</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading audit trail…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No events yet</p>
            <p className="text-sm">Once you run a scan or sync an invoice, every step will appear here.</p>
          </div>
        ) : (
          <ol className="relative border-l border-border/60 ml-2 space-y-4">
            {filtered.map((it) => (
              <li key={it.id} className="pl-6 relative">
                <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-muted ring-4 ring-background text-primary">
                  {iconFor(it.type)}
                </span>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{it.title}</p>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {labelFor(it.type)}
                  </Badge>
                </div>
                {it.detail && <p className="text-sm text-muted-foreground">{it.detail}</p>}
                {it.reasoning && (
                  <p className="text-xs mt-1 italic text-muted-foreground/90">
                    <span className="font-semibold not-italic">Why: </span>{it.reasoning}
                  </p>
                )}
                <time className="text-xs text-muted-foreground/70">
                  {new Date(it.at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

const LedgerLogCard = () => {
  const { entries, loading, syncing, sync } = useLedgerLog();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return entries.slice(0, 100);
    const q = query.toLowerCase();
    return entries
      .filter(
        (e) =>
          e.vendor?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.month.includes(q) ||
          e.type.includes(q),
      )
      .slice(0, 100);
  }, [entries, query]);


  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Ledger Log
            </CardTitle>
            <CardDescription>
              Permanent record of every entry that hit your ledger, grouped by month and year. Rows removed from Google Sheets are kept here (marked as removed) so your history stays intact.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search log…"
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => sync(true)} disabled={syncing} className="shrink-0">
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              <span className="ml-2 hidden sm:inline">Sync</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading permanent log…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No ledger entries yet</p>
            <p className="text-sm">Entries appear here after your first sync.</p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-auto rounded-md border border-border/50">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 sticky top-0 z-10">
                <tr className="text-left">
                  <th className="p-2 font-medium">Month</th>
                  <th className="p-2 font-medium">Date</th>
                  <th className="p-2 font-medium">Vendor</th>
                  <th className="p-2 font-medium">Category</th>
                  <th className="p-2 font-medium">Type</th>
                  <th className="p-2 font-medium text-right">Amount</th>
                  <th className="p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-border/40">
                    <td className="p-2 tabular-nums text-xs text-muted-foreground">{e.month}</td>
                    <td className="p-2 text-xs">{e.entry_date ?? "-"}</td>
                    <td className="p-2 truncate max-w-[180px]">{e.vendor || "-"}</td>
                    <td className="p-2 text-muted-foreground truncate max-w-[140px]">{e.category || "-"}</td>
                    <td className="p-2">
                      <Badge
                        variant="outline"
                        className={
                          e.type === "income"
                            ? "bg-success/15 text-success border-0"
                            : e.type === "expense"
                            ? "bg-destructive/15 text-destructive border-0"
                            : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0"
                        }
                      >
                        {e.type}
                      </Badge>
                    </td>
                    <td className="p-2 text-right tabular-nums font-medium">{formatMoney(e.amount, e.currency)}</td>
                    <td className="p-2">
                      {e.verified_present ? (
                        <span className="text-xs text-muted-foreground">In sheet</span>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-0 text-[10px]">
                          Removed
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogTab;
