CREATE POLICY "Users can update their own scan jobs"
ON public.scan_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);