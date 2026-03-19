
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scan_job_id uuid REFERENCES public.scan_jobs(id) ON DELETE CASCADE,
  invoice_vendor text,
  invoice_total text,
  invoice_date text,
  invoice_number text,
  invoice_category text,
  invoice_type text,
  year text,
  month_folder text,
  web_view_link text,
  file_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
