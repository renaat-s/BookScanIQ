ALTER TABLE public.scan_schedules ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

UPDATE public.scan_schedules SET lookback_weeks = 4 WHERE lookback_weeks IN (1,2);

ALTER TABLE public.scan_schedules DROP CONSTRAINT IF EXISTS scan_schedules_lookback_check;
ALTER TABLE public.scan_schedules ADD CONSTRAINT scan_schedules_lookback_check CHECK (lookback_weeks IN (4,8,12));