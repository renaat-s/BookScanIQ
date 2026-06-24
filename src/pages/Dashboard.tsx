import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
} from "recharts";
import {
  ArrowUpDown, ExternalLink, Loader2, Search,
  TrendingUp, TrendingDown, Receipt, Wallet, Sparkles,
  Download, ScanLine, Upload, RefreshCw, Activity,
  ArrowUpRight, ArrowDownRight, Clock, Building2, Filter, Plug,
} from "lucide-react";
import WorkspacesTab from "@/components/WorkspacesTab";
import AuditLogTab from "@/components/AuditLogTab";
import SavingsWidget from "@/components/SavingsWidget";
import TipsCard from "@/components/TipsCard";
import { useDirectoryGuard } from "@/hooks/useDirectoryGuard";
import { useLowCogMode } from "@/contexts/LowCogModeContext";
import { ShieldCheck, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface Invoice {
  id: string;
  invoice_vendor: string | null;
  invoice_total: string | null;
  invoice_date: string | null;
  invoice_number: string | null;
  invoice_category: string | null;
  invoice_type: string | null;
  web_view_link: string | null;
  file_id: string | null;
  year: string | null;
  month_folder: string | null;
  created_at: string;
}

type SortKey = "invoice_date" | "invoice_vendor" | "invoice_total" | "created_at";
type SortDir = "asc" | "desc";

const parseAmount = (v: string | null) => {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
};

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const formatMoneyFull = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

const driveEmbed = (inv: Invoice) => {
  if (inv.file_id) return `https://drive.google.com/file/d/${inv.file_id}/preview`;
  if (inv.web_view_link) {
    const m = inv.web_view_link.match(/\/d\/([^/]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  }
  return null;
};

const relativeTime = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const guard = useDirectoryGuard();
  const { lowCog } = useLowCogMode();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [liveStats, setLiveStats] = useState<{ totalDocuments: number; income: number; expense: number; net: number } | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [authLoading, user, navigate]);

  // Happy-path trim: a fresh user (workspace ready, zero invoices) skips the
  // empty-state click and goes straight to /detect-invoices, where the period
  // selector still lets them pick 4/8/12 weeks. Runs at most once per session.
  useEffect(() => {
    if (loading) return;
    if (guard.status !== "ready") return;
    if (invoices.length !== 0) return;
    if (sessionStorage.getItem("iiq_skipped_empty_state") === "1") return;
    sessionStorage.setItem("iiq_skipped_empty_state", "1");
    navigate("/detect-invoices");
  }, [loading, guard.status, invoices.length, navigate]);

  const loadInvoices = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setInvoices((data as Invoice[]) || []);
  };

  const loadLiveStats = async () => {
    if (!user) return;
    setLiveLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("dashboard-live-stats");
      if (!error && data && !data.error) setLiveStats(data);
    } catch (e) {
      console.error("live stats error", e);
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      await loadInvoices();
      setLoading(false);
    })();
    loadLiveStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadInvoices(), loadLiveStats()]);
    setTimeout(() => setRefreshing(false), 400);
  };

  const categories = useMemo(
    () => Array.from(new Set(invoices.map((i) => i.invoice_category).filter(Boolean))) as string[],
    [invoices]
  );

  const filtered = useMemo(() => {
    let list = invoices;
    if (typeFilter !== "all") list = list.filter((i) => i.invoice_type === typeFilter);
    if (categoryFilter !== "all") list = list.filter((i) => i.invoice_category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        [i.invoice_vendor, i.invoice_number, i.invoice_category, i.invoice_total]
          .some((f) => f?.toLowerCase().includes(q))
      );
    }
    const sorted = [...list].sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (sortKey === "invoice_total") {
        av = parseAmount(a.invoice_total);
        bv = parseAmount(b.invoice_total);
      } else {
        av = av || "";
        bv = bv || "";
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [invoices, typeFilter, categoryFilter, search, sortKey, sortDir]);

  // Month bucketing using created_at for delta calc
  const nowDate = new Date();
  const thisMonthKey = `${nowDate.getFullYear()}-${nowDate.getMonth()}`;
  const lastDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
  const lastMonthKey = `${lastDate.getFullYear()}-${lastDate.getMonth()}`;

  const stats = useMemo(() => {
    let income = 0, expense = 0;
    let incomeThis = 0, expenseThis = 0, incomeLast = 0, expenseLast = 0;
    let countThis = 0, countLast = 0;

    invoices.forEach((i) => {
      const amt = parseAmount(i.invoice_total);
      const isIncome = (i.invoice_type || "").toLowerCase() === "income";
      if (isIncome) income += amt; else expense += amt;

      const created = new Date(i.created_at);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      if (key === thisMonthKey) {
        countThis++;
        if (isIncome) incomeThis += amt; else expenseThis += amt;
      } else if (key === lastMonthKey) {
        countLast++;
        if (isIncome) incomeLast += amt; else expenseLast += amt;
      }
    });

    const pct = (now: number, prev: number) => {
      if (prev === 0) return now > 0 ? 100 : 0;
      return ((now - prev) / prev) * 100;
    };

    return {
      total: invoices.length,
      income,
      expense,
      net: income - expense,
      countThis,
      docsDelta: pct(countThis, countLast),
      incomeDelta: pct(incomeThis, incomeLast),
      expenseDelta: pct(expenseThis, expenseLast),
      netDelta: pct(incomeThis - expenseThis, incomeLast - expenseLast),
    };
  }, [invoices, thisMonthKey, lastMonthKey]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((i) => {
      const key = i.invoice_category || "Uncategorized";
      map.set(key, (map.get(key) || 0) + parseAmount(i.invoice_total));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [invoices]);

  const categoryTotal = useMemo(() => byCategory.reduce((s, c) => s + c.value, 0), [byCategory]);

  const cashflow = useMemo(() => {
    const map = new Map<string, { key: string; label: string; income: number; expense: number; ts: number }>();
    invoices.forEach((i) => {
      const d = new Date(i.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      const cur = map.get(key) || {
        key, label, income: 0, expense: 0,
        ts: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
      };
      const amt = parseAmount(i.invoice_total);
      if ((i.invoice_type || "").toLowerCase() === "income") cur.income += amt;
      else cur.expense += amt;
      map.set(key, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => a.ts - b.ts)
      .slice(-6)
      .map((m) => ({ ...m, net: m.income - m.expense }));
  }, [invoices]);

  const topVendors = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    invoices.forEach((i) => {
      const name = i.invoice_vendor || "Unknown";
      const cur = map.get(name) || { name, total: 0, count: 0 };
      cur.total += parseAmount(i.invoice_total);
      cur.count += 1;
      map.set(name, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [invoices]);

  const recent = useMemo(() => invoices.slice(0, 5), [invoices]);
  const lastSyncAt = invoices[0]?.created_at || null;

  // "Latest run" = invoices created within 2h of the most-recent invoice's
  // created_at. Captures a single scan batch without needing scan_job joins.
  const latestRun = useMemo(() => {
    if (invoices.length === 0) return [];
    const newest = new Date(invoices[0].created_at).getTime();
    const cutoff = newest - 2 * 60 * 60 * 1000;
    return invoices.filter((i) => new Date(i.created_at).getTime() >= cutoff);
  }, [invoices]);

  const latestRunVendors = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    latestRun.forEach((i) => {
      const name = i.invoice_vendor || "Unknown";
      const cur = map.get(name) || { name, total: 0, count: 0 };
      cur.total += parseAmount(i.invoice_total);
      cur.count += 1;
      map.set(name, cur);
    });
    return Array.from(map.values());
  }, [latestRun]);

  const pieColors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--brand-accent))",
    "hsl(var(--dark-indigo))",
    "hsl(var(--success))",
    "hsl(var(--destructive))",
    "hsl(var(--primary) / 0.55)",
    "hsl(var(--accent) / 0.55)",
  ];

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const exportCsv = () => {
    const headers = ["Vendor", "Date", "Number", "Type", "Category", "Total", "Link"];
    const rows = filtered.map((i) => [
      i.invoice_vendor || "",
      i.invoice_date || "",
      i.invoice_number || "",
      i.invoice_type || "",
      i.invoice_category || "",
      i.invoice_total || "",
      i.web_view_link || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoiceiq-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  const embedUrl = selected ? driveEmbed(selected) : null;
  const firstName = (user?.user_metadata?.full_name || user?.email || "").split(/[\s@]/)[0] || "there";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Dashboard | InvoiceIQ</title>
        <meta name="description" content="View, verify and manage all your synced invoices in one place." />
      </Helmet>
      <Header />

      <main className="flex-1">
        {/* HERO STRIP — futuristic command bar */}
        <section className="relative overflow-hidden border-b border-primary/30 bg-gradient-header">
          <div className="absolute inset-0 opacity-20 pointer-events-none"
               style={{ backgroundImage: "radial-gradient(circle at 20% 10%, hsl(var(--accent) / 0.5), transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--brand-accent) / 0.4), transparent 45%)" }} />
          <div className="absolute inset-0 pointer-events-none bg-hex opacity-30" />
          <div className="absolute inset-0 pointer-events-none hero-grid-overlay opacity-40" />
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6 animate-fade-in">
              <div className="space-y-2 sm:space-y-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/25 backdrop-blur-sm text-white/90 text-[10px] sm:text-xs">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-300 animate-ping opacity-75" />
                      <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    </span>
                    <span className="data-line !text-white/80 !text-[10px]">SYS://LIVE</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/85 text-[10px] sm:text-xs">
                    <Clock className="w-3 h-3" />
                    Sync · {relativeTime(lastSyncAt)}
                  </div>
                </div>
                <h1 className="heading-cyber text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight break-words">
                  <span className="holo-text">Welcome back, {firstName}.</span>
                </h1>
              </div>
              <div className="flex w-full lg:w-auto">
                <Button onClick={handleRefresh} variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white w-full sm:w-auto">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </section>


        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {/* PREMIUM STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <PremiumStat
              icon={<Receipt className="w-5 h-5" />}
              label="Total Documents"
              value={liveStats ? String(liveStats.totalDocuments) : String(stats.total)}
              delta={stats.docsDelta}
              accent="primary"
              loading={liveLoading && !liveStats}
            />
            <PremiumStat
              icon={<TrendingUp className="w-5 h-5" />}
              label="Income"
              value={formatMoney(liveStats ? liveStats.income : stats.income)}
              delta={stats.incomeDelta}
              accent="success"
              loading={liveLoading && !liveStats}
            />
            <PremiumStat
              icon={<TrendingDown className="w-5 h-5" />}
              label="Expenses"
              value={formatMoney(liveStats ? liveStats.expense : stats.expense)}
              delta={stats.expenseDelta}
              accent="destructive"
              invertDelta
              loading={liveLoading && !liveStats}
            />
            <PremiumStat
              icon={<Wallet className="w-5 h-5" />}
              label="Net Position"
              value={formatMoney(liveStats ? liveStats.net : stats.net)}
              delta={stats.netDelta}
              accent="indigo"
              loading={liveLoading && !liveStats}
            />
          </div>


          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <TabsList className="bg-muted/60 backdrop-blur w-full sm:w-auto overflow-x-auto">
                <TabsTrigger value="overview" className="gap-1.5 flex-1 sm:flex-none"><Activity className="w-4 h-4" /><span className="hidden xs:inline sm:inline">Overview</span></TabsTrigger>
                <TabsTrigger value="workspaces" className="gap-1.5 flex-1 sm:flex-none"><Plug className="w-4 h-4" /><span className="hidden xs:inline sm:inline">Workspaces</span></TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5 flex-1 sm:flex-none"><ShieldCheck className="w-4 h-4" /><span className="hidden xs:inline sm:inline">Audit Log</span></TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 w-full sm:w-auto">
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </div>
            </div>


            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 m-0">
              {invoices.length === 0 ? (
                <EmptyState onDetect={() => navigate("/detect-invoices")} onCapture={() => navigate("/capture-invoices")} />
              ) : (
                <>
                  {lowCog && (
                    <TrafficLightStatus
                      docsThisMonth={stats.countThis}
                      net={liveStats ? liveStats.net : stats.net}
                      workspaceReady={guard.status === "ready"}
                      lastSyncAt={lastSyncAt}
                    />
                  )}
                  <div className="grid lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <SavingsWidget documentsThisMonth={stats.countThis} />
                    </div>
                    <TipsCard />
                  </div>
                  <div className="grid lg:grid-cols-3 gap-4">
                    {/* Cashflow */}
                    <Card className="lg:col-span-2 overflow-hidden border-border/60 shadow-card">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base font-semibold">Cashflow</CardTitle>
                            <CardDescription className="text-xs">Income vs expenses · last 6 months</CardDescription>
                          </div>
                          <div className="flex gap-3 text-xs">
                            <LegendDot color="hsl(var(--success))" label="Income" />
                            <LegendDot color="hsl(var(--destructive))" label="Expense" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <ChartContainer config={{}} className="h-[280px] w-full">
                          <ResponsiveContainer>
                            <AreaChart data={cashflow} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
                              <defs>
                                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.55} />
                                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                              <YAxis tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                              <RTooltip
                                contentStyle={{
                                  background: "hsl(var(--popover))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: 8,
                                  fontSize: 12,
                                }}
                                formatter={(v: number | string) => formatMoneyFull(Number(v))}
                              />
                              <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#gradIncome)" />
                              <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#gradExpense)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Category breakdown */}
                    <Card className="overflow-hidden border-border/60 shadow-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Spend by Category</CardTitle>
                        <CardDescription className="text-xs">Top {byCategory.length} categories</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          <ChartContainer config={{}} className="h-[200px] w-full">
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={2}>
                                  {byCategory.map((_, idx) => (
                                    <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                                  ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                              </PieChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="text-lg font-bold">{formatMoney(categoryTotal)}</div>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-3">
                          {byCategory.slice(0, 5).map((c, i) => {
                            const pct = categoryTotal ? (c.value / categoryTotal) * 100 : 0;
                            return (
                              <div key={c.name} className="flex items-center gap-2 text-xs">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pieColors[i % pieColors.length] }} />
                                <span className="truncate flex-1">{c.name}</span>
                                <span className="text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* Top vendors */}
                    <Card className="border-border/60 shadow-card">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" /> Top Vendors
                        </CardTitle>
                        <CardDescription className="text-xs">Ranked by total volume</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {topVendors.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No vendor data yet.</p>
                        ) : topVendors.map((v, i) => {
                          const max = topVendors[0].total || 1;
                          const pct = (v.total / max) * 100;
                          return (
                            <div key={v.name} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-6 h-6 rounded-md bg-gradient-primary text-white text-xs flex items-center justify-center font-semibold shrink-0">
                                    {i + 1}
                                  </span>
                                  <span className="font-medium truncate">{v.name}</span>
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">{v.count}</Badge>
                                </div>
                                <span className="font-semibold tabular-nums">{formatMoney(v.total)}</span>
                              </div>
                              <Progress value={pct} className="h-1.5" />
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Recent activity */}
                    <Card className="border-border/60 shadow-card">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" /> Recent Activity
                        </CardTitle>
                        <CardDescription className="text-xs">Latest synced documents</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ol className="relative border-l border-border/60 ml-2 space-y-4">
                          {recent.length === 0 && (
                            <p className="text-sm text-muted-foreground ml-3">Nothing yet.</p>
                          )}
                          {recent.map((inv) => {
                            const isIncome = (inv.invoice_type || "").toLowerCase() === "income";
                            return (
                              <li key={inv.id} className="ml-4 group cursor-pointer" onClick={() => setSelected(inv)}>
                                <span className={`absolute -left-1.5 w-3 h-3 rounded-full ring-2 ring-background ${isIncome ? "bg-success" : "bg-destructive"}`} />
                                <div className="flex items-start justify-between gap-3 group-hover:bg-muted/40 -mx-2 px-2 py-1 rounded-md transition-colors">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{inv.invoice_vendor || "Unknown vendor"}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {inv.invoice_category || "Uncategorized"} · {relativeTime(inv.created_at)}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className={`text-sm font-semibold ${isIncome ? "text-success" : "text-foreground"}`}>
                                      {isIncome ? "+" : "−"}{formatMoney(parseAmount(inv.invoice_total))}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            {/* WORKSPACES TAB — live Drive, Sheet, Xero, QuickBooks */}
            <TabsContent value="workspaces" className="m-0">
              <WorkspacesTab />
            </TabsContent>





            {/* AUDIT LOG TAB */}
            <TabsContent value="audit" className="m-0">
              <AuditLogTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selected.invoice_vendor || "Unknown vendor"}</SheetTitle>
                <SheetDescription>
                  {selected.invoice_number ? `Invoice #${selected.invoice_number}` : "Document details"}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="p-4 rounded-xl bg-gradient-subtle border border-border/60">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                  <div className="text-3xl font-bold text-foreground mt-1">
                    {selected.invoice_total ? formatMoneyFull(parseAmount(selected.invoice_total)) : "—"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Field label="Date" value={selected.invoice_date} />
                  <Field label="Type" value={selected.invoice_type} />
                  <Field label="Category" value={selected.invoice_category} />
                  <Field label="Number" value={selected.invoice_number} />
                  <Field label="Year" value={selected.year} />
                  <Field label="Month" value={selected.month_folder} />
                </div>

                {embedUrl ? (
                  <div className="border border-border/60 rounded-xl overflow-hidden bg-muted aspect-[3/4] shadow-card">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      title="Document preview"
                      allow="autoplay"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-6 border border-border/60 rounded-xl">
                    No preview available
                  </div>
                )}

                {selected.web_view_link && (
                  <a href={selected.web_view_link} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open original file in Google Drive
                    </Button>
                  </a>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const PremiumStat = ({
  icon, label, value, delta, accent, invertDelta = false, loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: number;
  accent: "primary" | "success" | "destructive" | "indigo";
  invertDelta?: boolean;
  loading?: boolean;
}) => {
  const accentMap: Record<string, string> = {
    primary: "from-primary/15 to-primary/0 text-primary",
    success: "from-success/15 to-success/0 text-success",
    destructive: "from-destructive/15 to-destructive/0 text-destructive",
    indigo: "from-[hsl(var(--dark-indigo))]/15 to-transparent text-[hsl(var(--dark-indigo))]",
  };
  const up = delta >= 0;
  const goodDirection = invertDelta ? !up : up;
  const accentText = accentMap[accent].split(" ").pop()!;
  return (
    <Card className="relative overflow-hidden border-border/60 shadow-card hover:shadow-elegant transition-all hover-scale hud-brackets">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentMap[accent]} opacity-60 pointer-events-none`} />
      <CardContent className="pt-5 sm:pt-6 relative">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center ${accentText}`}>
            {icon}
          </div>
          {!loading && isFinite(delta) && (
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
              goodDirection ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
            }`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(delta).toFixed(0)}%
            </div>
          )}
        </div>
        <div className="data-line !text-[9px] sm:!text-[10px] mb-1 truncate">{label}</div>
        <div className="text-xl sm:text-2xl font-bold text-foreground tabular-nums break-all min-h-[1.75rem] sm:min-h-[2rem] flex items-center">
          {loading ? (
            <span className={`inline-flex items-end gap-1 ${accentText}`} aria-label="Loading">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
            </span>
          ) : value}
        </div>
        <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">vs. previous month</div>
      </CardContent>
    </Card>
  );
};


const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5 text-muted-foreground">
    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
    {label}
  </div>
);

const EmptyState = ({ onDetect, onCapture }: { onDetect: () => void; onCapture: () => void }) => (
  <Card className="border-dashed border-2 border-border/60">
    <CardContent className="py-16 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center shadow-elegant">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <div>
        <h3 className="text-xl font-semibold">Your workspace is ready</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Sync your inbox to detect invoices automatically, or capture a single document right now.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={onDetect} className="gap-2">
          <ScanLine className="w-4 h-4" />
          Detect invoices in my inbox
        </Button>
        <Button onClick={onCapture} variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Capture an invoice
        </Button>
      </div>
    </CardContent>
  </Card>
);

const Field = ({ label, value }: { label: string; value: string | null }) => (
  <div>
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="font-medium text-foreground mt-0.5">{value || "—"}</div>
  </div>
);

const SortableHead = ({
  label, k, sortKey, sortDir, onClick, className,
}: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: SortDir;
  onClick: (k: SortKey) => void; className?: string;
}) => (
  <TableHead className={className}>
    <button
      onClick={() => onClick(k)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-foreground" : "opacity-40"}`} />
      {sortKey === k && <span className="sr-only">{sortDir}</span>}
    </button>
  </TableHead>
);

export default Dashboard;
