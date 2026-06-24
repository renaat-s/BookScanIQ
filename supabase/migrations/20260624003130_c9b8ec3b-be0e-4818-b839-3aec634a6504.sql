DROP POLICY IF EXISTS "Users insert own audit events" ON public.audit_events;
DROP POLICY IF EXISTS "Users delete own audit events" ON public.audit_events;
REVOKE INSERT, UPDATE, DELETE ON public.audit_events FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_events FROM anon;
GRANT ALL ON public.audit_events TO service_role;