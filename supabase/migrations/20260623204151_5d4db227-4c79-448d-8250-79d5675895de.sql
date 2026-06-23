
CREATE TABLE public.vendor_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_key TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, vendor_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_logos TO authenticated;
GRANT ALL ON public.vendor_logos TO service_role;

ALTER TABLE public.vendor_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own vendor logos"
  ON public.vendor_logos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_vendor_logos_updated_at
  BEFORE UPDATE ON public.vendor_logos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vendor_logos_user_key ON public.vendor_logos (user_id, vendor_key);
