import type { LedgerEntry } from "@/hooks/useLedgerLog";
import { dominantCurrency, formatMoney } from "@/lib/currency";

export type AlertKind = "duplicate" | "anomaly";
export type AlertConfidence = "high" | "medium";

export interface DetectedAlert {
  key: string;
  kind: AlertKind;
  confidence: AlertConfidence;
  title: string;
  reason: string;
  entries: LedgerEntry[];
}

const LEGAL_SUFFIXES = [
  "ltd",
  "limited",
  "llc",
  "llp",
  "inc",
  "incorporated",
  "plc",
  "co",
  "company",
  "corp",
  "corporation",
  "gmbh",
  "bv",
  "pty",
  "sa",
  "srl",
];

/** Lowercase, strip punctuation and common legal suffixes for fuzzy vendor matching. */
export function normaliseVendor(name: string | null | undefined): string {
  if (!name) return "";
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter((p) => !LEGAL_SUFFIXES.includes(p));
  return (parts.length ? parts : cleaned.split(" ")).join(" ").trim();
}

export function isUncategorized(entry: LedgerEntry): boolean {
  const hay = `${entry.type ?? ""} ${entry.vendor ?? ""}`.toLowerCase();
  return hay.includes("uncategor");
}

function entryDate(entry: LedgerEntry): Date | null {
  const raw = entry.entry_date || entry.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysApart(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000;
}

function fmtMoney(n: number, currency?: string | null): string {
  return formatMoney(n, currency);
}

function fmtDate(d: Date | null): string {
  return d
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "unknown date";
}

/** Deterministic key so a dismissal survives refetches. */
export function buildAlertKey(kind: string, parts: string[]): string {
  return `${kind}:${[...parts].sort().join("|")}`;
}

const DUP_WINDOW_DAYS = 14;
const AMOUNT_TOLERANCE = 0.01;

export function findDuplicates(entries: LedgerEntry[]): DetectedAlert[] {
  const groups = new Map<string, LedgerEntry[]>();
  for (const e of entries) {
    const vendor = normaliseVendor(e.vendor);
    const amount = Number(e.amount) || 0;
    if (!vendor || amount <= 0) continue;
    const bucket = `${vendor}::${amount.toFixed(2)}`;
    const list = groups.get(bucket);
    if (list) list.push(e);
    else groups.set(bucket, [e]);
  }

  const alerts: DetectedAlert[] = [];

  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => {
      const da = entryDate(a)?.getTime() ?? 0;
      const db = entryDate(b)?.getTime() ?? 0;
      return da - db;
    });

    // Cluster entries that fall inside a rolling 14-day window.
    let cluster: LedgerEntry[] = [];
    const flush = () => {
      if (cluster.length < 2) {
        cluster = [];
        return;
      }
      const first = cluster[0];
      const dates = cluster.map(entryDate);
      const sameDay =
        dates.every((d) => d !== null) &&
        dates.every((d) => d!.toDateString() === dates[0]!.toDateString());
      const spread =
        dates[0] && dates[dates.length - 1]
          ? Math.round(daysApart(dates[0]!, dates[dates.length - 1]!))
          : 0;
      const amount = Number(first.amount) || 0;
      const vendorLabel = first.vendor || "Unknown vendor";

      alerts.push({
        key: buildAlertKey("duplicate", cluster.map((c) => c.id)),
        kind: "duplicate",
        confidence: sameDay ? "high" : "medium",
        title: `Possible duplicate from ${vendorLabel}`,
        reason: sameDay
          ? `${cluster.length} entries from ${vendorLabel} for ${fmtMoney(amount, first.currency)} on the same date (${fmtDate(dates[0])}).`
          : `${cluster.length} entries from ${vendorLabel} for ${fmtMoney(amount, first.currency)} dated ${spread} day${spread === 1 ? "" : "s"} apart.`,
        entries: cluster,
      });
      cluster = [];
    };

    for (const e of sorted) {
      if (cluster.length === 0) {
        cluster = [e];
        continue;
      }
      const prev = entryDate(cluster[cluster.length - 1]);
      const cur = entryDate(e);
      const withinWindow =
        prev && cur ? daysApart(prev, cur) <= DUP_WINDOW_DAYS : true;
      const sameAmount =
        Math.abs((Number(e.amount) || 0) - (Number(cluster[0].amount) || 0)) <=
        AMOUNT_TOLERANCE;
      if (withinWindow && sameAmount) {
        cluster.push(e);
      } else {
        flush();
        cluster = [e];
      }
    }
    flush();
  }

  return alerts;
}

const SPIKE_MULTIPLIER = 3;
const MIN_ABS_DIFFERENCE = 100;
const OUTLIER_MULTIPLIER = 5;

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function findAnomalies(
  entries: LedgerEntry[],
  now: Date = new Date(),
): DetectedAlert[] {
  // Uncategorized data is unreliable, so it never forms a baseline.
  const clean = entries.filter((e) => !isUncategorized(e) && (Number(e.amount) || 0) > 0);
  const currentMonth = monthKey(now);
  const alerts: DetectedAlert[] = [];

  const buildSpikeAlerts = (
    dimension: "vendor",
    labelOf: (e: LedgerEntry) => string | null,
  ) => {
    const byGroup = new Map<string, LedgerEntry[]>();
    for (const e of clean) {
      const label = labelOf(e);
      if (!label) continue;
      const list = byGroup.get(label);
      if (list) list.push(e);
      else byGroup.set(label, [e]);
    }

    for (const [label, list] of byGroup) {
      const monthTotals = new Map<string, number>();
      for (const e of list) {
        const d = entryDate(e);
        if (!d) continue;
        const k = monthKey(d);
        monthTotals.set(k, (monthTotals.get(k) || 0) + (Number(e.amount) || 0));
      }
      const current = monthTotals.get(currentMonth) || 0;
      const priorKeys = [...monthTotals.keys()]
        .filter((k) => k < currentMonth)
        .sort()
        .slice(-5);
      if (priorKeys.length < 2 || current <= 0) continue;
      const priorAvg =
        priorKeys.reduce((sum, k) => sum + (monthTotals.get(k) || 0), 0) /
        priorKeys.length;
      if (priorAvg <= 0) continue;

      const ratio = current / priorAvg;
      if (ratio >= SPIKE_MULTIPLIER && current - priorAvg >= MIN_ABS_DIFFERENCE) {
        const groupCurrency = dominantCurrency(list);
        const involved = list.filter((e) => {
          const d = entryDate(e);
          return d && monthKey(d) === currentMonth;
        });
        alerts.push({
          key: buildAlertKey(`anomaly-${dimension}-${currentMonth}`, [label]),
          kind: "anomaly",
          confidence: ratio >= SPIKE_MULTIPLIER * 2 ? "high" : "medium",
          title: `${label} spend is unusually high`,
          reason: `Spend with ${label} this month is ${fmtMoney(current, groupCurrency)}, about ${ratio.toFixed(1)}x the ${priorKeys.length}-month average of ${fmtMoney(priorAvg, groupCurrency)}.`,
          entries: involved,
        });
      }
    }
  };

  buildSpikeAlerts("vendor", (e) => e.vendor?.trim() || null);

  // Single-entry outliers against the vendor's own median.
  const byVendor = new Map<string, LedgerEntry[]>();
  for (const e of clean) {
    const v = normaliseVendor(e.vendor);
    if (!v) continue;
    const list = byVendor.get(v);
    if (list) list.push(e);
    else byVendor.set(v, [e]);
  }
  for (const list of byVendor.values()) {
    if (list.length < 4) continue;
    const med = median(list.map((e) => Number(e.amount) || 0));
    if (med <= 0) continue;
    for (const e of list) {
      const amount = Number(e.amount) || 0;
      const d = entryDate(e);
      if (!d || monthKey(d) !== currentMonth) continue;
      if (amount >= med * OUTLIER_MULTIPLIER && amount - med >= MIN_ABS_DIFFERENCE) {
        alerts.push({
          key: buildAlertKey("anomaly-outlier", [e.id]),
          kind: "anomaly",
          confidence: "high",
          title: `Unusually large charge from ${e.vendor || "Unknown vendor"}`,
          reason: `This entry is ${fmtMoney(amount, e.currency)}, roughly ${(amount / med).toFixed(1)}x the typical ${fmtMoney(med, dominantCurrency(list, e.currency || undefined))} you normally see from this vendor.`,
          entries: [e],
        });
      }
    }
  }

  return alerts;
}

/** Keep only entries dated within the last `months` months. */
export function withinLastMonths(
  entries: LedgerEntry[],
  months = 6,
  now: Date = new Date(),
): LedgerEntry[] {
  const cutoff = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return entries.filter((e) => {
    const d = entryDate(e);
    return d ? d >= cutoff : false;
  });
}
