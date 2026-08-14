ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS qb_home_currency TEXT NOT NULL DEFAULT 'USD';
UPDATE public.user_credentials SET qb_home_currency = 'USD' WHERE qb_home_currency IS NULL;