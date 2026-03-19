
CREATE TABLE public.user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_refresh_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read their own credentials
CREATE POLICY "Users can view their own credentials"
  ON public.user_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own credentials
CREATE POLICY "Users can insert their own credentials"
  ON public.user_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own credentials
CREATE POLICY "Users can update their own credentials"
  ON public.user_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role policy for n8n edge functions to read tokens
CREATE POLICY "Service role can read all credentials"
  ON public.user_credentials FOR SELECT
  TO service_role
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON public.user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
