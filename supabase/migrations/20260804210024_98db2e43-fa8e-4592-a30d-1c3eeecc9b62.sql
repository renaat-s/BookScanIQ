-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- scan_jobs
DROP POLICY IF EXISTS "Users can view their own scan jobs" ON public.scan_jobs;
CREATE POLICY "Users can view their own scan jobs" ON public.scan_jobs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- vendor_logos
DROP POLICY IF EXISTS "Users manage their own vendor logos" ON public.vendor_logos;
CREATE POLICY "Users manage their own vendor logos" ON public.vendor_logos
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.scan_jobs FROM anon;
REVOKE ALL ON public.vendor_logos FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.scan_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_logos TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.scan_jobs TO service_role;
GRANT ALL ON public.vendor_logos TO service_role;