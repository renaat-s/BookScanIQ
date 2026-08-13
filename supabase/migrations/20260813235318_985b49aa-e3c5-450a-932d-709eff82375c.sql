ALTER TABLE public.ledger_entries
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC;

ALTER TABLE public.user_credentials
  ADD COLUMN IF NOT EXISTS default_currency TEXT NOT NULL DEFAULT 'GBP';

UPDATE public.ledger_entries SET currency = 'GBP' WHERE currency IS NULL OR currency = '';
