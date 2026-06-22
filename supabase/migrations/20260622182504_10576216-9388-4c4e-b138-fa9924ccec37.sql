CREATE POLICY "Users delete own audit events"
ON public.audit_events
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);