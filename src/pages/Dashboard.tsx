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
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import {
  ArrowUpDown, ExternalLink, FileText, Loader2, Search,
  TrendingUp, TrendingDown, Receipt, Wallet,
} from "lucide-react";

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
  const n = parseFloat(v.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
};

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

const driveEmbed = (inv: Invoice) => {
  if (inv.file_id) return `https://drive.google.com/file/d/${inv.file_id}/preview`;
  if (inv.web_view_link) {
    const m = inv.web_view_link.match(/\/d\/([^/]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  }
  return null;
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setInvoices((data as Invoice[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

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
      let av: any = a[sortKey];
      let bv: any = b[sortKey];
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

  const stats = useMemo(() => {
    const income = invoices
      .filter((i) => (i.invoice_type || "").toLowerCase() === "income")
      .reduce((s, i) => s + parseAmount(i.invoice_total), 0);
    const expense = invoices
      .filter((i) => (i.invoice_type || "").toLowerCase() !== "income")
      .reduce((s, i) => s + parseAmount(i.invoice_total), 0);
    return {
      total: invoices.length,
      income,
      expense,
      net: income - expense,
    };
  }, [invoices]);

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

  const byMonth = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    invoices.forEach((i) => {
      const key = `${i.year || "—"} ${i.month_folder || "—"}`;
      const cur = map.get(key) || { month: key, income: 0, expense: 0 };
      const amt = parseAmount(i.invoice_total);
      if ((i.invoice_type || "").toLowerCase() === "income") cur.income += amt;
      else cur.expense += amt;
      map.set(key, cur);
    });
    return Array.from(map.values()).slice(-6);
  }, [invoices]);

  const pieColors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))", "hsl(var(--primary) / 0.6)", "hsl(var(--accent) / 0.6)", "hsl(var(--secondary) / 0.6)"];

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const embedUrl = selected ? driveEmbed(selected) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Dashboard | InvoiceIQ</title>
        <meta name="description" content="View, verify and manage all your synced invoices in one place." />
      </Helmet>
      <Header />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Everything we've synced from your inbox — no need to open Google Sheets.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Receipt className="w-5 h-5" />} label="Total Documents" value={String(stats.total)} />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-success" />} label="Income" value={formatMoney(stats.income)} />
          <StatCard icon={<TrendingDown className="w-5 h-5 text-destructive" />} label="Expenses" value={formatMoney(stats.expense)} />
          <StatCard icon={<Wallet className="w-5 h-5 text-primary" />} label="Net" value={formatMoney(stats.net)} />
        </div>

        {/* Charts */}
        {invoices.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spend by Category</CardTitle>
                <CardDescription>Top 8 categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[260px] w-full">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                        {byCategory.map((_, idx) => (
                          <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity by Month</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[260px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={byMonth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="income" fill="hsl(var(--success, var(--primary)))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters + table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
              <CardTitle className="text-lg">All Documents</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vendor, number, category…"
                    className="pl-8 w-full sm:w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No documents match your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHead label="Vendor" k="invoice_vendor" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                      <SortableHead label="Date" k="invoice_date" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                      <TableHead>Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <SortableHead label="Total" k="invoice_total" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => (
                      <TableRow
                        key={inv.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setSelected(inv)}
                      >
                        <TableCell className="font-medium">{inv.invoice_vendor || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{inv.invoice_date || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{inv.invoice_number || "—"}</TableCell>
                        <TableCell>
                          {inv.invoice_type ? (
                            <Badge variant={inv.invoice_type.toLowerCase() === "income" ? "default" : "secondary"}>
                              {inv.invoice_type}
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {inv.invoice_category ? <Badge variant="outline">{inv.invoice_category}</Badge> : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {inv.invoice_total ? formatMoney(parseAmount(inv.invoice_total)) : "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {inv.web_view_link && (
                            <a href={inv.web_view_link} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="gap-1.5">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.invoice_vendor || "Unknown vendor"}</SheetTitle>
                <SheetDescription>
                  {selected.invoice_number ? `Invoice #${selected.invoice_number}` : "Document details"}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Field label="Date" value={selected.invoice_date} />
                  <Field label="Total" value={selected.invoice_total ? formatMoney(parseAmount(selected.invoice_total)) : null} />
                  <Field label="Type" value={selected.invoice_type} />
                  <Field label="Category" value={selected.invoice_category} />
                  <Field label="Year" value={selected.year} />
                  <Field label="Month" value={selected.month_folder} />
                </div>

                {embedUrl ? (
                  <div className="border rounded-lg overflow-hidden bg-muted aspect-[3/4]">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      title="Document preview"
                      allow="autoplay"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                    No preview available
                  </div>
                )}

                {selected.web_view_link && (
                  <a href={selected.web_view_link} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open original file
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

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
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
