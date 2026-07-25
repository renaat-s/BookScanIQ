## Analytics Feature + Solo Tier

Adds an **Analytics** tab to the Dashboard, gated by plan. Also wires up the new **InvoiceIQ: Solo ($75)** tier and introduces a permanent per-user ledger log so historical analytics survive edits/deletes in Google Sheets.

---

### 1. Solo tier ($75)

Add to `src/lib/stripe-plans.ts`:
- Name: `Solo`
- Product: `prod_Ux0JqEpkSviKSJ`, monthly price: `price_1Tx6IiARQphcY8qGxe9drgPX`
- 250 scans/month, `hasAccountingIntegrations: true` (Xero/QB), `hasAdvancedAnalytics: false`
- Annual variant reuses monthly for now (you can add annual later; I'll leave a TODO)
- Add new flag `hasAdvancedAnalytics: boolean` on every plan:
  - Starter: false · Solo: false · Professional: true · Enterprise: true
- Show it on `/pricing` between Starter and Professional.

### 2. Permanent ledger log (source of truth for history)

Google Sheets is user-editable, so trends/charts need a durable mirror.

New table `public.ledger_entries` (RLS: user reads own rows only; service_role full):
```
id uuid pk, user_id uuid, entry_date date, month text (YYYY-MM),
type text ('income'|'expense'|'uncategorized'),
amount numeric, vendor text, category text,
document_type text ('invoice'|'receipt'|'bill'|'other'),
drive_file_id text, source text ('sheet_sync'|'n8n'|'manual'),
sheet_row_hash text unique per user (idempotency),
created_at timestamptz default now()
```

Insert paths (append-only from the app's perspective):
- **New edge function `sync-ledger-log`**: on-demand + daily; reads the user's Bookkeeping sheet, hashes each row, upserts by `(user_id, sheet_row_hash)`. Idempotent, safe to re-run. Called automatically when the Analytics tab loads (with a 15-min cooldown) and via a "Refresh log" button.
- **Backfill**: first Analytics load performs a full sheet scan so the log matches the user's history to date.
- Deletions in Sheets do **not** delete log rows (that's the point). A `verified_present` bool is toggled on each sync.

New "Ledger Log" section inside the Audit Log tab so users can view/scroll/export the full permanent log.

### 3. Analytics tab on Dashboard

New tab `Analytics` in `src/pages/Dashboard.tsx` alongside existing tabs. Content is tier-gated:

**Basic Analytics** (Starter, Solo) — sourced from `ledger_entries` (current month) + `scan_jobs`/`invoices`:
- Scans this month card: count + usage bar with 80% amber / 100% red states (reuses `useScanUsage`)
- Documents processed this month: total + breakdown by `document_type` (invoice/receipt/bill/other) as stacked bar
- Monthly totals: income / expenses / net (same values as main dashboard cards, restated here)
- Recent activity: last 10 rows from `invoices` joined with status chip (processed / uncategorized / error)

**Advanced Analytics** (Professional, Enterprise) — all of Basic, plus:
- Trends: 6-month income vs expense line chart (recharts) from `ledger_entries` grouped by `month`
- Category spend: horizontal bar chart of top 10 vendors/categories (current month, toggle to 6-mo)
- Uncategorized rate: single stat + sparkline over 6 months
- Scan history: table of every `scan_jobs` row with document count, duration, status, started/finished timestamps
- Sync status: last 20 rows from `audit_events` filtered to Xero/QB sync events — success count, failure count, last-sync-per-platform badges

For Starter/Solo users, an **"Upgrade for Advanced Analytics"** upsell card appears where the advanced section would be, linking to `/pricing#professional`.

### 4. Files

New:
- `supabase/migrations/<ts>_ledger_log.sql` (table + grants + RLS + indexes on user_id, month)
- `supabase/functions/sync-ledger-log/index.ts`
- `src/hooks/useLedgerLog.ts` (fetch + trigger sync)
- `src/components/analytics/AnalyticsTab.tsx` (router: basic vs advanced)
- `src/components/analytics/BasicAnalytics.tsx`
- `src/components/analytics/AdvancedAnalytics.tsx`
- `src/components/analytics/charts/` (TrendChart, CategoryChart, UncategorizedTrend, ScanHistoryTable, SyncStatusPanel)

Modified:
- `src/lib/stripe-plans.ts` — add Solo, add `hasAdvancedAnalytics`, add `canUseAdvancedAnalytics(tier)`
- `src/pages/Dashboard.tsx` — add Analytics tab
- `src/pages/Pricing.tsx` — render Solo card
- `src/components/AuditLogTab.tsx` — add "Ledger Log" sub-section
- `check-subscription` edge fn — recognise Solo product IDs

### Technical notes

- Charts: `recharts` (already installed).
- Sync cooldown stored in `user_credentials.last_ledger_sync_at` (new column) to prevent spam.
- All new queries use `useQuery` with 5-min stale time.
- Row hash = SHA-256 of `date|type|amount|vendor|category` per user, so identical rows collapse.
- `uncategorized` rows are logged but excluded from income/expense sums (matches existing dashboard rule).

Ready to build.