ALTER TABLE public.user_credentials
  ADD COLUMN IF NOT EXISTS xero_refresh_token text,
  ADD COLUMN IF NOT EXISTS quickbooks_refresh_token text;