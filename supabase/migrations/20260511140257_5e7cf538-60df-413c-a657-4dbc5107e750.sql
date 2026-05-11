
CREATE TABLE IF NOT EXISTS public.waitlist_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_rate_limits_ip_time
  ON public.waitlist_rate_limits (ip_address, submitted_at DESC);

ALTER TABLE public.waitlist_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (which bypasses RLS) reads/writes this table.

-- Drop public insert policy on waitlist; all inserts now go through the edge function.
DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.waitlist;

-- Schedule daily cleanup of old rate-limit rows
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'waitlist-rate-limits-cleanup') THEN
    PERFORM cron.unschedule('waitlist-rate-limits-cleanup');
  END IF;
END $$;

SELECT cron.schedule(
  'waitlist-rate-limits-cleanup',
  '0 3 * * *',
  $$DELETE FROM public.waitlist_rate_limits WHERE submitted_at < now() - interval '24 hours'$$
);
