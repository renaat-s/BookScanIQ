-- Create scan_jobs table to track backlog scan progress
CREATE TABLE public.scan_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('forward', 'backfill')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_emails INTEGER DEFAULT 0,
  processed_emails INTEGER DEFAULT 0,
  invoices_found INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scan_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own scan jobs" 
ON public.scan_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scan jobs" 
ON public.scan_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_scan_jobs_user_id ON public.scan_jobs(user_id);
CREATE INDEX idx_scan_jobs_status ON public.scan_jobs(status);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scan_jobs_updated_at
BEFORE UPDATE ON public.scan_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();