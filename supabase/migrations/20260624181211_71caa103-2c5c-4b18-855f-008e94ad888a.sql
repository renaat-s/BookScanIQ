-- Indexes for hot per-user lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_created ON public.invoices (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_scan_job ON public.invoices (scan_job_id) WHERE scan_job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scan_jobs_user_created ON public.scan_jobs (user_id, created_at DESC);

-- Lock down trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_credentials_email() FROM PUBLIC, anon, authenticated;