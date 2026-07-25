import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RTooltip, BarChart, Bar,
} from "recharts";
import { AlertTriangle, TrendingUp, PieChart as PieIcon, RefreshCcw, ScanLine, CheckCircle2, XCircle } from "lucide-react";
import type { LedgerEntry } from "@/hooks/useLedgerLog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// Smart axis tick: pick unit + precision based on magnitude so small values
// aren't all rounded down to "$0k".
const formatAxisMoney = (v: number) => {
  const abs = Math.abs(v);
  if (abs === 0) return "$0";
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `$${Math.round(v / 1000)}k`;
  if (abs >= 1_000) return `$${(v / 1000).toFixed(1)}k`;
  if (abs >= 100) return `$${Math.round(v)}`;
  return `$${v.toFixed(0)}`;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
};

interface Props {
  entries: LedgerEntry[];
}

interface ScanJobRow {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  invoices_found: number | null;
  scan_type: string | null;
}

interface AuditRow {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

const AdvancedAnalytics = ({ entries }: Props) => {
  const { user } = useAuth();
  const [scanJobs, setScanJobs] = useState<ScanJobRow[]>([]);
  const [syncEvents, setSyncEvents] = useState<AuditRow[]>([]);

  const [docCounts, setDocCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [jobs, audit] = await Promise.all([
        supabase
          .from("scan_jobs")
          .select("id, status, created_at, completed_at, invoices_found, scan_type")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("audit_events")
          .select("id, event_type, message, created_at")
          .eq("user_id", user.id)
          .or("event_type.ilike.%xero%,event_type.ilike.%quickbooks%,event_type.ilike.%sync%")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      const jobRows = (jobs.data as ScanJobRow[]) || [];
      setScanJobs(jobRows);
      setSyncEvents((audit.data as AuditRow[]) || []);

      // Fallback doc count: n8n does not report invoices_found back, and the
      // invoices table is unused. Count ledger entries whose last_seen_at
      // falls between the scan start and completion (+5 min buffer). This
      // approximates docs processed per scan using the durable ledger log.
      const counts: Record<string, number> = {};
      await Promise.all(
        jobRows.map(async (j) => {
          if (j.invoices_found && j.invoices_found > 0) {
            counts[j.id] = j.invoices_found;
            return;
          }
          if (!j.completed_at) return;
          const endWindow = new Date(new Date(j.completed_at).getTime() + 5 * 60_000).toISOString();
          const { count } = await supabase
            .from("ledger_entries")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("last_seen_at", j.created_at)
            .lte("last_seen_at", endWindow);
          counts[j.id] = count ?? 0;
        }),
      );
      setDocCounts(counts);
    })();
  }, [user]);

  // Build a 6-month window with income/expense/uncategorized totals
  const last6 = useMemo(() => {
    const buckets: { key: string; label: string; income: number; expense: number; total: number; uncat: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({ key, label: monthLabel(key), income: 0, expense: 0, total: 0, uncat: 0 });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    entries.forEach((e) => {
      const i = idx.get(e.month);
      if (i == null) return;
      buckets[i].total += 1;
      if (e.type === "income") buckets[i].income += e.amount;
      else if (e.type === "expense") buckets[i].expense += e.amount;
      else buckets[i].uncat += 1;
    });
    return buckets.map((b) => ({
      ...b,
      net: b.income - b.expense,
      uncatRate: b.total ? Math.round((b.uncat / b.total) * 100) : 0,
    }));
  }, [entries]);

  const nowMonth = last6[last6.length - 1]?.key;

  // Category spend (current month, expense + uncategorized excluded)
  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      if (e.month !== nowMonth) return;
      if (e.type !== "expense") return;
      const key = e.vendor || e.category || "Unknown";
      map.set(key, (map.get(key) ?? 0) + e.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [entries, nowMonth]);

  const currentUncatRate = last6[last6.length - 1]?.uncatRate ?? 0;

  // Sync status summary
  const syncSummary = useMemo(() => {
    let xeroOk = 0, xeroFail = 0, qbOk = 0, qbFail = 0;
    let xeroLast: string | null = null, qbLast: string | null = null;
    syncEvents.forEach((e) => {
      const t = e.event_type.toLowerCase();
      const failed = t.includes("fail") || t.includes("error");
      if (t.includes("xero")) {
        if (!xeroLast) xeroLast = e.created_at;
        failed ? xeroFail++ : xeroOk++;
      }
      if (t.includes("quickbooks") || t.includes("qb")) {
        if (!qbLast) qbLast = e.created_at;
        failed ? qbFail++ : qbOk++;
      }
    });
    return { xeroOk, xeroFail, xeroLast, qbOk, qbFail, qbLast };
  }, [syncEvents]);

  const durationLabel = (job: ScanJobRow) => {
    if (!job.completed_at) return "-";
    const ms = new Date(job.completed_at).getTime() - new Date(job.created_at).getTime();
    if (ms <= 0) return "-";
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* 6-month trend */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Trends
            </CardTitle>
            <CardDescription>Income vs expense · last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer>
              <LineChart data={last6} margin={{ top: 6, right: 12, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" tickFormatter={formatAxisMoney} />
                <RTooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number | string) => formatMoney(Number(v))}
                />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category spend */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" /> Category spend
            </CardTitle>
            <CardDescription>Top expenses this month by vendor/category</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No expenses this month.</p>
            ) : (
              <ResponsiveContainer>
                <BarChart data={topCategories} layout="vertical" margin={{ left: 8, right: 12, top: 6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={110} className="text-xs" />
                  <RTooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number | string) => formatMoney(Number(v))}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Uncategorized rate */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" /> Uncategorized rate
              </CardTitle>
              <CardDescription>Share of documents flagged as unreliable</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums">{currentUncatRate}%</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[140px]">
          <ResponsiveContainer>
            <LineChart data={last6} margin={{ top: 6, right: 12, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <RTooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number | string) => `${v}%`}
              />
              <Line type="monotone" dataKey="uncatRate" stroke="hsl(var(--brand-accent))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Scan history */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-primary" /> Scan history
            </CardTitle>
            <CardDescription>Every scan job on your account</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[320px] overflow-auto">
            {scanJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No scans yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanJobs.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="text-xs">{new Date(j.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            j.status === "completed"
                              ? "bg-success/15 text-success border-0"
                              : j.status === "failed"
                              ? "bg-destructive/15 text-destructive border-0"
                              : "bg-muted text-muted-foreground border-0"
                          }
                        >
                          {j.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">{j.invoices_found ?? 0}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{durationLabel(j)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sync status */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-primary" /> Sync status
            </CardTitle>
            <CardDescription>Xero & QuickBooks sync activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SyncPlatformRow
              name="Xero"
              ok={syncSummary.xeroOk}
              fail={syncSummary.xeroFail}
              last={syncSummary.xeroLast}
            />
            <SyncPlatformRow
              name="QuickBooks"
              ok={syncSummary.qbOk}
              fail={syncSummary.qbFail}
              last={syncSummary.qbLast}
            />
            {syncEvents.length === 0 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                No sync activity recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SyncPlatformRow = ({
  name,
  ok,
  fail,
  last,
}: {
  name: string;
  ok: number;
  fail: number;
  last: string | null;
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30">
    <div>
      <p className="font-medium text-sm">{name}</p>
      <p className="text-xs text-muted-foreground">
        {last ? `Last event ${new Date(last).toLocaleString()}` : "No events yet"}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-success/15 text-success border-0 gap-1">
        <CheckCircle2 className="w-3 h-3" /> {ok}
      </Badge>
      <Badge variant="outline" className="bg-destructive/15 text-destructive border-0 gap-1">
        <XCircle className="w-3 h-3" /> {fail}
      </Badge>
    </div>
  </div>
);

export default AdvancedAnalytics;
