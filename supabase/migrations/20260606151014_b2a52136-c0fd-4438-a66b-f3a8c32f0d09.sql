
-- Revoke any client-side grants on sensitive waitlist tables.
-- Service role bypasses RLS and retains full access for the edge function.
REVOKE ALL ON TABLE public.waitlist FROM anon, authenticated;
REVOKE ALL ON TABLE public.waitlist_rate_limits FROM anon, authenticated;

GRANT ALL ON TABLE public.waitlist TO service_role;
GRANT ALL ON TABLE public.waitlist_rate_limits TO service_role;

-- Explicit deny-all policies (satisfies linter "RLS enabled, no policy").
-- A permissive policy with USING(false)/WITH CHECK(false) plus no other
-- policies = no client access. Service role bypasses RLS.

DROP POLICY IF EXISTS "Deny all client access to waitlist" ON public.waitlist;
CREATE POLICY "Deny all client access to waitlist"
  ON public.waitlist
  AS PERMISSIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all client access to waitlist_rate_limits"
  ON public.waitlist_rate_limits;
CREATE POLICY "Deny all client access to waitlist_rate_limits"
  ON public.waitlist_rate_limits
  AS PERMISSIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
