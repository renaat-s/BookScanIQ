/**
 * Single source of truth for money formatting.
 *
 * Every entry carries the currency it was captured with on the Ledger Sheet
 * (ledger_entries.currency). Any surface that shows that entry MUST format it
 * with that same currency — never a hardcoded GBP/USD.
 */

const FALLBACK_CURRENCY = "USD";

const normalise = (currency?: string | null): string => {
  const c = (currency || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : FALLBACK_CURRENCY;
};

export function formatMoney(
  amount: number | null | undefined,
  currency?: string | null,
  opts: { maximumFractionDigits?: number; minimumFractionDigits?: number } = {},
): string {
  const n = Number(amount);
  const value = Number.isFinite(n) ? n : 0;
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: normalise(currency),
    minimumFractionDigits: opts.minimumFractionDigits ?? 2,
    maximumFractionDigits: opts.maximumFractionDigits ?? 2,
  });
}

/** Currency symbol/prefix for a code, used for chart axes. */
export function currencySymbol(currency?: string | null): string {
  const code = normalise(currency);
  const parts = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? code;
}

/**
 * Most frequently used currency across a set of entries, so aggregate totals
 * are labelled with the currency they actually represent.
 */
export function dominantCurrency(
  entries: Array<{ currency?: string | null }>,
  fallback: string = FALLBACK_CURRENCY,
): string {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const c = (e.currency || "").trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(c)) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best = normalise(fallback);
  let bestCount = 0;
  for (const [c, n] of counts) {
    if (n > bestCount) {
      best = c;
      bestCount = n;
    }
  }
  return best;
}

/** True when entries span more than one currency (totals are then approximate). */
export function hasMixedCurrencies(entries: Array<{ currency?: string | null }>): boolean {
  const seen = new Set<string>();
  for (const e of entries) {
    const c = (e.currency || "").trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(c)) seen.add(c);
  }
  return seen.size > 1;
}
