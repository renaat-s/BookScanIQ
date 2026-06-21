-- 1. Audit events table
CREATE TABLE public.audit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  reasoning TEXT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  scan_job_id UUID REFERENCES public.scan_jobs(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own audit events"
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own audit events"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_events_user_created ON public.audit_events(user_id, created_at DESC);
CREATE INDEX idx_audit_events_invoice ON public.audit_events(invoice_id) WHERE invoice_id IS NOT NULL;

-- 2. Add minutes_per_doc to profiles for Savings widget (used in step 3)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS minutes_per_doc INTEGER NOT NULL DEFAULT 5;