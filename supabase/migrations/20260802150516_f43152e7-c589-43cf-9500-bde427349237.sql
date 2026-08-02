CREATE TABLE public.scan_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'weekly',
  day_of_week smallint NOT NULL DEFAULT 1,
  hour_utc smallint NOT NULL DEFAULT 7,
  lookback_weeks smallint NOT NULL DEFAULT 4,
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scan_schedules_user_unique UNIQUE (user_id),
  CONSTRAINT scan_schedules_frequency_check CHECK (frequency IN ('daily','weekly')),
  CONSTRAINT scan_schedules_dow_check CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT scan_schedules_hour_check CHECK (hour_utc BETWEEN 0 AND 23),
  CONSTRAINT scan_schedules_lookback_check CHECK (lookback_weeks IN (1,2,4,8,12))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scan_schedules TO authenticated;
GRANT ALL ON public.scan_schedules TO service_role;

ALTER TABLE public.scan_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own scan schedule" ON public.scan_schedules
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scan schedule" ON public.scan_schedules
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scan schedule" ON public.scan_schedules
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own scan schedule" ON public.scan_schedules
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_scan_schedules_updated_at
  BEFORE UPDATE ON public.scan_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_scan_schedules_due ON public.scan_schedules (enabled, next_run_at);

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;