# Feature C — Duplicate & Anomaly Detection

Catch double-sent invoices and unusual spending, using only data already in the app. No n8n work at all.

## What the user sees

A new **Alerts** view in the Dashboard (tab alongside Analytics / Audit Log) plus a small alert count badge on the Dashboard header.

Each alert is a card showing:
- Type chip: `Possible duplicate` (amber) or `Spend anomaly` (red)
- Plain-English reason, e.g. "Two entries from Acme Ltd for £249.00 dated 3 days apart" or "Amazon spend this month is 4x your 6-month average"
- The entries involved (vendor, date, amount, category), each linking to the document in Drive where a link exists
- Actions: **Dismiss** (hides it permanently) and **View in Ledger**

Empty state: "No issues found. Your ledger looks clean."

## Detection rules

Run over `ledger_entries` for the signed-in user (last 6 months).

**Duplicates** — two or more entries where:
- same vendor (normalised: lowercase, trimmed, punctuation/legal suffixes stripped), AND
- amount equal within 1p, AND
- dates within 14 days of each other

Confidence: `high` if same amount + same date, `medium` otherwise.

**Spend anomalies** — per vendor and per category:
- current-month total > 3x the average of the prior 5 months, AND absolute difference > £100 (avoids noise on tiny amounts)
- a single entry > 5x that vendor's median entry amount

Uncategorized entries are included in duplicate checks but excluded from anomaly baselines (their data is unreliable).

## Technical details

**Database** — one new migration:

```text
public.alert_dismissals
  id uuid pk
  user_id uuid not null
  alert_key text not null      -- deterministic hash of the rule + entry ids
  created_at timestamptz
  unique (user_id, alert_key)
```
With GRANTs for `authenticated` / `service_role`, RLS enabled, and policies scoped to `auth.uid() = user_id` (select/insert/delete).

No change to `ledger_entries` — detection is derived, not stored, so it stays accurate as new rows sync in.

**Detection logic** — new `src/lib/anomaly-detection.ts`, pure functions over the `LedgerEntry[]` already fetched by `useLedgerLog.ts`:
- `normaliseVendor(name)`
- `findDuplicates(entries)`
- `findAnomalies(entries)`
- `buildAlertKey(alert)` — stable key so dismissals survive refetch

Pure and deterministic, so it is unit-testable with no network.

**Hook** — `src/hooks/useAlerts.ts`: reads ledger entries, runs the detectors, subtracts dismissed keys from `alert_dismissals`, returns `{ alerts, counts, dismiss, loading }`.

**UI** — `src/components/dashboard/AlertsTab.tsx` plus a small `AlertCard.tsx`, using existing shadcn `Card`, `Badge`, `Button`, `Tooltip` and the app's semantic tokens. Wired into the Dashboard tab list next to Analytics, lazy-loaded like `AnalyticsTab`. Respects Neurodivergent Mode (no motion, larger spacing, traffic-light colouring).

**Tier gating** — follows the existing pattern in `stripe-plans.ts` / `useScanUsage.ts`: duplicate detection for all paid tiers; spend-anomaly alerts for Pro and Enterprise, with a locked-state upsell card for Starter and Solo.

## Out of scope

- No auto-deletion or auto-merging of duplicates (report only)
- No email notifications for alerts
- No changes to n8n, Xero, or QuickBooks export
