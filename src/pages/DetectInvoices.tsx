import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, Loader2, AlertCircle, Play, History, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { InvoiceResultsCard } from '@/components/InvoiceResultsCard';
import { useDirectoryGuard } from '@/hooks/useDirectoryGuard';
import SetupGuardCard from '@/components/SetupGuardCard';

const MIN_SCAN_DATE = new Date(2025, 2, 26); // March 26, 2025
const formatDDMMYYYY = (d: Date) => format(d, 'dd/MM/yyyy');

type ScanType = 'forward' | 'backfill';
type BacklogDuration = 4 | 8 | 12;

/** Parse n8n error responses into user-friendly messages */
const parseErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    // Future structured error codes from n8n Error Trigger node
    if (err.error === 'AUTH_FAILURE') {
      return 'Your email connection has expired. Please re-authenticate with Google and try again.';
    }
    if (err.error === 'RATE_LIMIT') {
      return 'Too many requests. Please wait a few minutes and try again.';
    }
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error === 'string') return err.error;
  }
  return 'Unable to start the scan. Please try again.';
};

const DetectInvoices = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const guard = useDirectoryGuard();
  const [step, setStep] = useState<'auth' | 'confirm' | 'select-scan' | 'select-backlog-duration' | 'select-scan-date' | 'connecting' | 'scanning' | 'results' | 'connected' | 'failed'>('auth');
  const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(null);
  const [backlogDuration, setBacklogDuration] = useState<BacklogDuration | null>(null);
  const [customScanDate, setCustomScanDate] = useState<Date | undefined>(undefined);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [pendingScanDate, setPendingScanDate] = useState<Date | undefined>(undefined);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !hasInitialized) {
      if (user) {
        setStep('confirm');
      } else {
        setStep('auth');
      }
      setHasInitialized(true);
    }
  }, [user, loading, hasInitialized]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleConfirmEmail = () => {
    setStep('select-scan');
  };

  const handleSelectScanType = (scanType: ScanType) => {
    setSelectedScanType(scanType);
    if (scanType === 'backfill') {
      setStep('select-backlog-duration');
    } else {
      // Forward scan is deactivated
      handleStartScan(scanType);
    }
  };

  const handleStartScan = async (scanType: ScanType, duration?: BacklogDuration, scanFromDate?: Date) => {
    if (!user?.email) return;
    const fromDate = scanFromDate ?? new Date();
    const scanFromDateStr = formatDDMMYYYY(fromDate);

    setStep('connecting');

    try {
      const { data: jobData, error: jobError } = await supabase
        .from('scan_jobs')
        .insert({
          user_id: user.id,
          email: user.email,
          scan_type: scanType,
          status: 'pending',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      const jobId = jobData.id;
      setCurrentJobId(jobId);
      setBacklogDuration(duration || null);

      if (scanType === 'backfill') {
        // Show the comforting pop-up after 30 seconds
        const popupTimer = setTimeout(() => {
          setStep('scanning');
          // After 2 minutes on the popup, auto-transition to results (done)
          const doneTimer = setTimeout(() => {
            setStep('results');
            toast({
              title: 'Processing Complete!',
              description: 'Your invoices have been processed and sent to your connected platforms.',
            });
          }, 120_000);
          // Store doneTimer so it can be cleared if edge function resolves first
          (window as Window & { __invoiceIqDoneTimer?: ReturnType<typeof setTimeout> }).__invoiceIqDoneTimer = doneTimer;
        }, 30_000);

        // Fire the edge function in the background
        supabase.functions.invoke('connect-email-detector', {
          body: {
            email: user.email,
            scanType,
            jobId,
            userId: user.id,
            scanFromDate: scanFromDateStr,
            ...(duration && { backlogWeeks: duration }),
          },
        }).then(async ({ data, error }) => {
          clearTimeout(popupTimer);
          const w = window as Window & { __invoiceIqDoneTimer?: ReturnType<typeof setTimeout> };
          if (w.__invoiceIqDoneTimer) {
            clearTimeout(w.__invoiceIqDoneTimer);
          }

          if (error) throw error;

          await supabase
            .from('profiles')
            .update({ n8n_webhook_connected: true })
            .eq('user_id', user.id);

          setStep('results');
          toast({
            title: 'Processing Complete!',
            description: 'Your invoice and receipt data has finished processing.',
          });
        }).catch((err) => {
          clearTimeout(popupTimer);
          const w = window as Window & { __invoiceIqDoneTimer?: ReturnType<typeof setTimeout> };
          if (w.__invoiceIqDoneTimer) {
            clearTimeout(w.__invoiceIqDoneTimer);
          }
          console.error('Connection error:', err);
          setStep('failed');
          toast({
            title: 'Connection Failed',
            description: parseErrorMessage(err),
            variant: 'destructive',
          });
        });
      } else {
        // Forward scan — keep original synchronous flow
        const { data, error } = await supabase.functions.invoke('connect-email-detector', {
          body: {
            email: user.email,
            scanType,
            jobId,
            userId: user.id,
            scanFromDate: scanFromDateStr,
          },
        });

        if (error) throw error;

        await supabase
          .from('profiles')
          .update({ n8n_webhook_connected: true })
          .eq('user_id', user.id);

        setStep('connected');
        toast({
          title: 'Forward Scan Started!',
          description: 'Your inbox is now linked and will detect new invoices.',
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStep('failed');
      toast({
        title: 'Connection Failed',
        description: parseErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const handleScanComplete = () => {
    // Show invoice results instead of generic completion
    setStep('results');
  };

  const handleUseDifferentEmail = async () => {
    await supabase.auth.signOut();
    setStep('auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Detect Invoices - InvoiceIQ Email Receipt Detector</title>
        <meta name="description" content="Connect your email inbox to automatically detect and process invoices with AI." />
      </Helmet>
      <Header />
      
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-lg mx-auto">
          {/* Directory setup guard — blocks all feature steps until ready */}
          {user && guard.status !== 'ready' && guard.status !== 'loading' && (
            <SetupGuardCard
              status={guard.status}
              spreadsheetId={guard.spreadsheetId}
              onTriggerSetup={guard.triggerSetup}
            />
          )}

          {(!user || guard.status === 'ready') && step === 'auth' && (
            <Card className="border-2">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create Your Account</CardTitle>
                <CardDescription className="text-base">
                  Sign in with Google to connect your email inbox to the Invoice Detector AI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleGoogleSignIn} 
                  className="w-full" 
                  size="lg"
                  variant="hero"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  We'll use your Google email to detect invoices in your inbox.
                </p>
              </CardContent>
            </Card>
          )}

          {guard.status === 'ready' && step === 'confirm' && user && (
            <Card className="border-2">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Confirm Your Email</CardTitle>
                <CardDescription className="text-base">
                  Is this the email inbox you want to connect to the Invoice Detector AI?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-lg font-medium">{user.email}</p>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={handleConfirmEmail} 
                    className="w-full" 
                    size="lg"
                    variant="hero"
                  >
                    Yes, Connect This Email
                  </Button>
                  <Button 
                    onClick={handleUseDifferentEmail} 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                  >
                    Use a Different Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {guard.status === 'ready' && step === 'select-scan' && user && (
            <Card className="border-2">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Choose Scan Type</CardTitle>
                <CardDescription className="text-base">
                  How would you like to detect invoices in <span className="font-medium">{user.email}</span>?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Forward Scan — temporarily deactivated */}
                <div className="relative">
                  <Button 
                    disabled
                    className="w-full h-auto py-4 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed" 
                    size="lg"
                    variant="hero"
                  >
                    <Play className="w-6 h-6" />
                    <span className="text-lg font-semibold">Forward Scan</span>
                    <span className="text-sm opacity-80 font-normal">Detect new invoices as they arrive</span>
                  </Button>
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 text-xs"
                  >
                    Coming Soon
                  </Badge>
                </div>

                <Button 
                  onClick={() => handleSelectScanType('backfill')} 
                  className="w-full h-auto py-4 flex flex-col items-center gap-2" 
                  size="lg"
                  variant="outline"
                >
                  <History className="w-6 h-6" />
                  <span className="text-lg font-semibold">Backlog Scan</span>
                  <span className="text-sm text-muted-foreground font-normal">Scan existing emails for past invoices</span>
                </Button>
                <Button 
                  onClick={handleUseDifferentEmail} 
                  variant="ghost" 
                  className="w-full" 
                  size="sm"
                >
                  Use a Different Email
                </Button>
              </CardContent>
            </Card>
          )}

          {guard.status === 'ready' && step === 'select-backlog-duration' && user && (
            <Card className="border-2">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">How Far Back?</CardTitle>
                <CardDescription className="text-base">
                  Choose how many weeks of past emails to scan for invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {([4, 8, 12] as BacklogDuration[]).map((weeks) => (
                  <Button 
                    key={weeks}
                    onClick={() => { setBacklogDuration(weeks); setStep('select-scan-date'); }} 
                    className="w-full h-auto py-4 flex flex-col items-center gap-1" 
                    size="lg"
                    variant="outline"
                  >
                    <span className="text-lg font-semibold">{weeks} Weeks</span>
                    <span className="text-sm text-muted-foreground font-normal">
                      Scan emails from the past {weeks} weeks
                    </span>
                  </Button>
                ))}
                <Button 
                  onClick={() => setStep('select-scan')} 
                  variant="ghost" 
                  className="w-full" 
                  size="sm"
                >
                  Go Back
                </Button>
              </CardContent>
            </Card>
          )}

          {guard.status === 'ready' && step === 'select-scan-date' && user && backlogDuration && (
            <Card className="border-2">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Scan From Which Date?</CardTitle>
                <CardDescription className="text-base">
                  Your {backlogDuration}-week backlog scan will go back from the date you choose.
                  Pick any date between March 26, 2025 and today.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleStartScan('backfill', backlogDuration, new Date())}
                  className="w-full h-auto py-4 flex flex-col items-center gap-1"
                  size="lg"
                  variant="hero"
                >
                  <span className="text-lg font-semibold">From Today</span>
                  <span className="text-sm opacity-80 font-normal">
                    Scan the past {backlogDuration} weeks ending today
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-auto py-4 flex flex-col items-center gap-1',
                    !customScanDate && 'text-muted-foreground'
                  )}
                  size="lg"
                  onClick={() => {
                    setPendingScanDate(customScanDate);
                    setDateDialogOpen(true);
                  }}
                >
                  <span className="text-lg font-semibold">
                    {customScanDate ? `From ${formatDDMMYYYY(customScanDate)}` : 'Choose a Date'}
                  </span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Pick a custom end date for the {backlogDuration}-week window
                  </span>
                </Button>

                <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Select Scan Date</DialogTitle>
                      <DialogDescription>
                        Pick any date between March 26, 2025 and today.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={pendingScanDate}
                        onSelect={setPendingScanDate}
                        disabled={(date) => date > new Date() || date < MIN_SCAN_DATE}
                        defaultMonth={pendingScanDate ?? customScanDate ?? new Date()}
                        initialFocus
                        className={cn('p-3 pointer-events-auto scale-110')}
                      />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                      <Button variant="outline" onClick={() => setDateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="hero"
                        disabled={!pendingScanDate}
                        onClick={() => {
                          if (pendingScanDate) {
                            setCustomScanDate(pendingScanDate);
                            setDateDialogOpen(false);
                          }
                        }}
                      >
                        Confirm Date
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {customScanDate && (
                  <Button
                    onClick={() => handleStartScan('backfill', backlogDuration, customScanDate)}
                    className="w-full"
                    size="lg"
                    variant="hero"
                  >
                    Start Scan From {formatDDMMYYYY(customScanDate)}
                  </Button>
                )}

                <Button
                  onClick={() => setStep('select-backlog-duration')}
                  variant="ghost"
                  className="w-full"
                  size="sm"
                >
                  Go Back
                </Button>
              </CardContent>
            </Card>
          )}
          {step === 'connecting' && (
            <Card className="border-2">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <CardTitle className="text-2xl">
                  {selectedScanType === 'forward' ? 'Starting Forward Scan...' : 'Starting Backlog Scan...'}
                </CardTitle>
                <CardDescription className="text-base">
                  Please wait while we set up the Invoice Detector AI for your email.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {(step === 'scanning' || (step === 'results' && selectedScanType === 'backfill')) && (
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="text-center space-y-5 pb-2">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  {step === 'results' ? (
                    <CheckCircle className="w-8 h-8 text-primary" />
                  ) : (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {step === 'results' ? 'Processing Complete' : 'Processing Your Data'}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {step === 'results'
                    ? 'Your invoice and receipt email data has been processed and sent through your connected workflow.'
                    : 'Your invoice & receipt email data is being extracted, organized, and sent to your connected platforms. This may take a few minutes — sit back and relax!'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                {/* Platform pipeline */}
                <div className="flex items-center justify-center gap-3">
                  {/* Google Drive */}
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 w-[72px]">
                    <svg viewBox="0 0 87.3 78" className="w-8 h-8">
                      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
                      <path d="M43.65 25.15L29.9 1.35c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5l16.15-27.99z" fill="#00AC47"/>
                      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.7c.8-1.4 1.2-2.95 1.2-4.5H59.85L53.5 64.5l-3.6 6.3 13.75 23.8c1.35-.8 2.5-1.9 3.3-3.3l6.6-14.5z" fill="#EA4335"/>
                      <path d="M43.65 25.15L57.4 1.35C56.05.55 54.5 0 52.85 0H34.45c-1.65 0-3.2.55-4.55 1.35l13.75 23.8z" fill="#00832D"/>
                      <path d="M59.85 53.2h27.5c0-1.55-.4-3.1-1.2-4.5L73.6 27.45c-.8-1.4-1.95-2.5-3.3-3.3L56.55 48l3.3 5.2z" fill="#2684FC"/>
                      <path d="M27.5 53.2L13.75 76.8c1.35.8 2.9 1.35 4.55 1.35h50.7c1.65 0 3.2-.55 4.55-1.35L59.85 53.2H27.5z" fill="#FFBA00"/>
                    </svg>
                    <span className="text-[10px] font-medium text-muted-foreground">Drive</span>
                  </div>

                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground/50 shrink-0"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>

                  {/* Google Sheets */}
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 w-[72px]">
                    <svg viewBox="0 0 48 48" className="w-8 h-8">
                      <path fill="#43A047" d="M37 45H11c-1.657 0-3-1.343-3-3V6c0-1.657 1.343-3 3-3h19l10 10v29c0 1.657-1.343 3-3 3z"/>
                      <path fill="#C8E6C9" d="M40 13H30V3z"/>
                      <path fill="#2E7D32" d="M30 13l10 10V13z"/>
                      <path fill="#E8F5E9" d="M31 23H17v16h14V23z"/>
                      <path fill="#43A047" d="M17 23h14v2H17zm0 4h14v2H17zm0 4h14v2H17zm0 4h14v2H17z"/>
                    </svg>
                    <span className="text-[10px] font-medium text-muted-foreground">Sheets</span>
                  </div>

                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground/50 shrink-0"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>

                  {/* Xero */}
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 w-[72px]">
                    <svg viewBox="0 0 48 48" className="w-8 h-8">
                      <circle cx="24" cy="24" r="22" fill="#13B5EA"/>
                      <path d="M14 16l10 8-10 8M26 16l-3.5 8L26 32M30 16v16M34 24h-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                    <span className="text-[10px] font-medium text-muted-foreground">Xero</span>
                  </div>

                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground/50 shrink-0"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>

                  {/* QuickBooks */}
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 w-[72px]">
                    <svg viewBox="0 0 48 48" className="w-8 h-8">
                      <circle cx="24" cy="24" r="22" fill="#2CA01C"/>
                      <path d="M16 14v20M16 24h8c2.2 0 4-1.8 4-4s-1.8-4-4-4h-4M32 34V14M32 24h-8c-2.2 0-4 1.8-4 4s1.8 4 4 4h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                    <span className="text-[10px] font-medium text-muted-foreground">QuickBooks</span>
                  </div>
                </div>

                {/* Pulsing status bar */}
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full bg-primary/60 ${step === 'results' ? 'w-full' : 'w-2/3 animate-pulse'}`} />
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {step === 'results'
                    ? 'Everything has finished successfully.'
                    : "Please don't close this page while processing is in progress."}
                </p>

                {step === 'results' && (
                  <Button
                    onClick={() => navigate('/')}
                    className="w-full"
                    size="lg"
                    variant="outline"
                  >
                    Return to Home
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {step === 'results' && currentJobId && selectedScanType !== 'backfill' && (
            <InvoiceResultsCard
              jobId={currentJobId}
              onBack={() => setStep('select-scan')}
              onHome={() => navigate('/')}
            />
          )}

          {step === 'connected' && (
            <Card className="border-2 border-primary/30">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  {selectedScanType === 'forward' ? 'Forward Scan Active!' : 'Backlog Scan Complete!'}
                </CardTitle>
                <CardDescription className="text-base">
                {selectedScanType === 'forward' 
                    ? 'Your email inbox is now linked. We\'ll automatically detect new invoices from your emails.'
                    : 'Your backlog scan has completed successfully.'}
              </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => navigate('/')} 
                  className="w-full" 
                  size="lg"
                  variant="outline"
                >
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'failed' && (
            <Card className="border-2 border-destructive/50">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl text-destructive">Scan Failed</CardTitle>
                <CardDescription className="text-base">
                  We couldn't start the {selectedScanType === 'forward' ? 'forward' : 'backlog'} scan. 
                  Would you like to try again?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => {
                    if (selectedScanType === 'backfill' && backlogDuration) {
                      handleStartScan('backfill', backlogDuration);
                    } else if (selectedScanType === 'forward') {
                      handleStartScan('forward');
                    } else {
                      setStep('select-scan');
                    }
                  }} 
                  className="w-full" 
                  size="lg"
                  variant="hero"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => setStep('select-scan')} 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                >
                  Choose Different Scan Type
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="ghost" 
                  className="w-full" 
                  size="sm"
                >
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DetectInvoices;
