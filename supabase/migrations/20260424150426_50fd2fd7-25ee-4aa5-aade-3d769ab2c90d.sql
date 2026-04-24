-- 1. Add email column
ALTER TABLE public.user_credentials
ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill existing rows from auth.users
UPDATE public.user_credentials uc
SET email = u.email
FROM auth.users u
WHERE uc.user_id = u.id
  AND uc.email IS NULL;

-- 3. Trigger function to auto-populate email from auth.users on insert/update
CREATE OR REPLACE FUNCTION public.set_user_credentials_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR (TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    SELECT u.email INTO NEW.email
    FROM auth.users u
    WHERE u.id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS trg_set_user_credentials_email ON public.user_credentials;
CREATE TRIGGER trg_set_user_credentials_email
BEFORE INSERT OR UPDATE OF user_id ON public.user_credentials
FOR EACH ROW
EXECUTE FUNCTION public.set_user_credentials_email();

-- 5. Index for lookups by email
CREATE INDEX IF NOT EXISTS idx_user_credentials_email ON public.user_credentials(email);