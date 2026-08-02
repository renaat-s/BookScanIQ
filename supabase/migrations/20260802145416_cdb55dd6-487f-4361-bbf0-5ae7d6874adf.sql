CREATE TABLE public.alert_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, alert_key)
);

GRANT SELECT, INSERT, DELETE ON public.alert_dismissals TO authenticated;
GRANT ALL ON public.alert_dismissals TO service_role;

ALTER TABLE public.alert_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own alert dismissals" ON public.alert_dismissals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own alert dismissals" ON public.alert_dismissals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own alert dismissals" ON public.alert_dismissals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_alert_dismissals_user ON public.alert_dismissals(user_id);