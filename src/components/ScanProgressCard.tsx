import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle, FileText, Mail } from 'lucide-react';

interface ScanJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_emails: number;
  processed_emails: number;
  invoices_found: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

interface ScanProgressCardProps {
  jobId: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export const ScanProgressCard = ({ jobId, onComplete, onBack }: ScanProgressCardProps) => {
  const [job, setJob] = useState<ScanJob | null>(null);
  const [loading, setLoading] = useState(true);

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from('scan_jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

      if (!error && data) {
        setJob(data as ScanJob);
      }
      setLoading(false);
    };

    fetchJob();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchJob, 3000);

    // Auto-fail after 60s if no progress
    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, 60_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [jobId]);

  // When timed out and still no progress, mark as failed
  useEffect(() => {
    if (
      timedOut &&
      job &&
      (job.status === 'pending' || job.status === 'running') &&
      job.processed_emails === 0 &&
      job.invoices_found === 0
    ) {
      // Update the job locally to show failure
      setJob(prev => prev ? {
        ...prev,
        status: 'failed' as const,
        error_message: 'The scan timed out — no emails were scanned within 60 seconds. Please check your inbox connection and try again.',
        completed_at: new Date().toISOString(),
      } : null);

      // Also update the backend so the state is persisted
      supabase.functions.invoke('update-scan-progress', {
        body: {
          jobId,
          status: 'failed',
          errorMessage: 'The scan timed out — no emails were scanned within 60 seconds. Please check your inbox connection and try again.',
        },
      });
    }
  }, [timedOut, job, jobId]);

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card className="border-2 border-destructive/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Job Not Found</CardTitle>
          <CardDescription>Unable to find the scan job. Please try again.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} variant="outline" className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = job.total_emails > 0 
    ? Math.round((job.processed_emails / job.total_emails) * 100) 
    : 0;

  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
      case 'running':
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-success" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-destructive" />;
    }
  };

  const getStatusTitle = () => {
    switch (job.status) {
      case 'pending':
        return 'Preparing Scan...';
      case 'running':
        return 'Scanning Emails...';
      case 'completed':
        return 'Scan Complete!';
      case 'failed':
        return 'Scan Failed';
    }
  };

  const getStatusDescription = () => {
    switch (job.status) {
      case 'pending':
        return 'Setting up the scan. This should only take a moment.';
      case 'running':
        return `Processing your emails. ${job.processed_emails} of ${job.total_emails || '?'} emails scanned.`;
      case 'completed':
        return `Successfully scanned ${job.processed_emails} emails and found ${job.invoices_found} invoices.`;
      case 'failed':
        return job.error_message || 'An error occurred during the scan. Please try again.';
    }
  };

  const getElapsedTime = () => {
    const start = new Date(job.started_at).getTime();
    const end = job.completed_at ? new Date(job.completed_at).getTime() : Date.now();
    const elapsed = Math.floor((end - start) / 1000);
    
    if (elapsed < 60) return `${elapsed}s`;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds}s`;
  };

  const isInProgress = job.status === 'pending' || job.status === 'running';
  const borderClass = job.status === 'completed' 
    ? 'border-success/30' 
    : job.status === 'failed' 
    ? 'border-destructive/50' 
    : '';

  return (
    <Card className={`border-2 ${borderClass}`}>
      <CardHeader className="text-center space-y-4">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
          job.status === 'completed' ? 'bg-success/10' : 
          job.status === 'failed' ? 'bg-destructive/10' : 
          'bg-primary/10'
        }`}>
          {getStatusIcon()}
        </div>
        <CardTitle className={`text-2xl ${
          job.status === 'completed' ? 'text-success' : 
          job.status === 'failed' ? 'text-destructive' : ''
        }`}>
          {getStatusTitle()}
        </CardTitle>
        <CardDescription className="text-base">
          {getStatusDescription()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress bar */}
        {isInProgress && job.total_emails > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <Mail className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-semibold">{job.processed_emails}</div>
            <div className="text-xs text-muted-foreground">Emails Scanned</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <FileText className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-semibold">{job.invoices_found}</div>
            <div className="text-xs text-muted-foreground">Invoices Found</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <Loader2 className={`w-5 h-5 mx-auto mb-1 text-muted-foreground ${isInProgress ? '' : 'animate-none'}`} />
            <div className="text-xl font-semibold">{getElapsedTime()}</div>
            <div className="text-xs text-muted-foreground">Elapsed Time</div>
          </div>
        </div>

        {/* Actions */}
        {job.status === 'completed' && (
          <Button onClick={onComplete} className="w-full" size="lg" variant="hero">
            Continue
          </Button>
        )}
        
        {job.status === 'failed' && (
          <Button onClick={onBack} variant="outline" className="w-full" size="lg">
            Try Again
          </Button>
        )}

        {isInProgress && (
          <p className="text-center text-sm text-muted-foreground">
            Please keep this page open. The scan will continue in the background.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
