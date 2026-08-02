ALTER TABLE public.ledger_entries
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS exported_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_ledger_entries_review_status
  ON public.ledger_entries (user_id, review_status);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_drive_file_id
  ON public.ledger_entries (user_id, drive_file_id);

CREATE OR REPLACE FUNCTION public.validate_ledger_review_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.review_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid review_status: %', NEW.review_status;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.review_status IS DISTINCT FROM OLD.review_status THEN
    NEW.reviewed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_ledger_review_status_trg ON public.ledger_entries;
CREATE TRIGGER validate_ledger_review_status_trg
  BEFORE INSERT OR UPDATE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.validate_ledger_review_status();

DROP TRIGGER IF EXISTS update_ledger_entries_updated_at ON public.ledger_entries;
CREATE TRIGGER update_ledger_entries_updated_at
  BEFORE UPDATE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS review_queue_enabled boolean NOT NULL DEFAULT false;