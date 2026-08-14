import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, FileText, TrendingUp, TrendingDown, Wallet, Receipt, ScanLine } from "lucide-react";
import type { LedgerEntry } from "@/hooks/useLedgerLog";
import type { ScanUsage } from "@/hooks/useScanUsage";
import { dominantCurrency, formatMoney } from "@/lib/currency";


interface Props {
  entries: LedgerEntry[];
  monthKey: string; // YYYY-MM
  usage: ScanUsage;
}

const DOC_TYPES = ["invoice", "receipt", "bill", "other"] as const;
const DOC_COLORS: Record<string, string> = {
  invoice: "hsl(var(--primary))",
  receipt: "hsl(var(--accent))",
  bill: "hsl(var(--brand-accent))",
  other: "hsl(var(--muted-foreground))",
};

const BasicAnalytics = ({ entries, monthKey, usage }: Props) => {
  const monthEntries = useMemo(
    () => entries.filter((e) => e.month === monthKey),
    [entries, monthKey],
  );

  const totals = useMemo(() => {
    let income = 0,
      expense = 0,
      uncategorized = 0;
    monthEntries.forEach((e) => {
      if (e.type === "income") income += e.amount;
      else if (e.type === "expense") expense += e.amount;
      else uncategorized += 1;
    });
    return { income, expense, net: income - expense, uncategorized, count: monthEntries.length };
  }, [monthEntries]);

  const byType = useMemo(() => {
    const map: Record<string, number> = { invoice: 0, receipt: 0, bill: 0, other: 0 };
    monthEntries.forEach((e) => {
      const t = (e.document_type || "other") as string;
      map[t] = (map[t] ?? 0) + 1;
    });
    return map;
  }, [monthEntries]);

  const recent = useMemo(() => entries.slice(0, 10), [entries]);

  // Totals inherit the currency the entries were captured with on the Ledger Sheet.
  const monthCurrency = useMemo(() => dominantCurrency(monthEntries), [monthEntries]);

  const usagePct = usage.percent;
  const usageColor = usage.atCap
    ? "bg-destructive"
    : usage.nearCap
    ? "bg-yellow-500"
    : "bg-primary";

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <ScanLine className="w-4 h-4" /> Scans this month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">{usage.used}</span>
              <span className="text-sm text-muted-foreground">
                / {usage.cap === null ? "∞" : usage.cap}
              </span>
            </div>
            {usage.cap !== null && (
              <>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all ${usageColor}`}
                    style={{ width: `${Math.min(100, usagePct)}%` }}
                  />
                </div>
                {usage.atCap ? (
                  <p className="text-xs text-destructive font-medium">Cap reached, upgrade to continue.</p>
                ) : usage.nearCap ? (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Nearing your monthly cap.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{usagePct}% of monthly cap used</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" /> Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success tabular-nums">{formatMoney(totals.income, monthCurrency)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" /> Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive tabular-nums">{formatMoney(totals.expense, monthCurrency)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Net position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${totals.net >= 0 ? "text-success" : "text-destructive"}`}>
              {formatMoney(totals.net, monthCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Documents by type
            </CardTitle>
            <CardDescription>
              {totals.count} document{totals.count === 1 ? "" : "s"} processed this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totals.count === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No documents yet this month.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {DOC_TYPES.map((t) => {
                    const pct = totals.count ? (byType[t] / totals.count) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={t}
                        className="h-full transition-all"
                        style={{ width: `${pct}%`, background: DOC_COLORS[t] }}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {DOC_TYPES.map((t) => (
                    <div key={t} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: DOC_COLORS[t] }} />
                        <span className="capitalize text-muted-foreground">{t}</span>
                      </div>
                      <span className="font-semibold tabular-nums">{byType[t]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Recent activity
            </CardTitle>
            <CardDescription>Last 10 documents from your permanent log</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nothing yet.</p>
            ) : (
              <ul className="space-y-2">
                {recent.map((e) => {
                  const status =
                    e.type === "uncategorized"
                      ? { label: "Uncategorized", color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400", icon: <AlertTriangle className="w-3 h-3" /> }
                      : !e.verified_present
                      ? { label: "Removed", color: "bg-muted text-muted-foreground", icon: <AlertTriangle className="w-3 h-3" /> }
                      : { label: "Processed", color: "bg-success/15 text-success", icon: <CheckCircle2 className="w-3 h-3" /> };
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/30 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{e.vendor || "Unknown vendor"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {e.entry_date ?? "no date"} · {e.vendor || "Unknown vendor"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold tabular-nums">
                          {e.type === "income" ? "+" : e.type === "expense" ? "−" : ""}
                          {formatMoney(e.amount, e.currency)}
                        </p>
                        <Badge variant="outline" className={`text-[10px] gap-1 border-0 ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BasicAnalytics;
