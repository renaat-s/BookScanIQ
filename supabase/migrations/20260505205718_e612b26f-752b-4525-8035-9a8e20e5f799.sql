DROP POLICY IF EXISTS "Users can create their own scan jobs" ON public.scan_jobs;
CREATE POLICY "Users can create their own scan jobs"
ON public.scan_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
ON public.user_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);