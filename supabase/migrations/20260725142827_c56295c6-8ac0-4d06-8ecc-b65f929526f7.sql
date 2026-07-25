-- Permanent per-user ledger log
CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date,
  month text NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense','uncategorized')),
  amount numeric NOT NULL DEFAULT 0,
  vendor text,
  category text,
  document_type text,
  drive_file_id text,
  source text NOT NULL DEFAULT 'sheet_sync',
  sheet_row_hash text NOT NULL,
  verified_present boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sheet_row_hash)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_entries TO authenticated;
GRANT ALL ON public.ledger_entries TO service_role;

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ledger entries"
  ON public.ledger_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ledger entries"
  ON public.ledger_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ledger entries"
  ON public.ledger_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own ledger entries"
  ON public.ledger_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_ledger_entries_user_month ON public.ledger_entries (user_id, month);
CREATE INDEX idx_ledger_entries_user_date ON public.ledger_entries (user_id, entry_date DESC);
CREATE INDEX idx_ledger_entries_user_type ON public.ledger_entries (user_id, type);

CREATE TRIGGER update_ledger_entries_updated_at
  BEFORE UPDATE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sync throttle column
ALTER TABLE public.user_credentials
  ADD COLUMN IF NOT EXISTS last_ledger_sync_at timestamptz;