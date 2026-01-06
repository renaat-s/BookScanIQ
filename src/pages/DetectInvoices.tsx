import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, Loader2, AlertCircle, Play, History, Calendar } from 'lucide-react';

type ScanType = 'forward' | 'backfill';
type BacklogDuration = 4 | 8 | 12;

const DetectInvoices = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'auth' | 'confirm' | 'select-scan' | 'select-backlog-duration' | 'connecting' | 'connected' | 'failed'>('auth');
  const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(null);
  const [backlogDuration, setBacklogDuration] = useState<BacklogDuration | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Only set initial step once when page loads - don't reset after scan starts
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
      handleStartScan(scanType);
    }
  };

  const handleStartScan = async (scanType: ScanType, duration?: BacklogDuration) => {
    if (!user?.email) return;
    
    setStep('connecting');

    try {
      const { error } = await supabase.functions.invoke('connect-email-detector', {
        body: { 
          email: user.email,
          scanType,
          ...(duration && { backlogWeeks: duration })
        },
      });

      if (error) throw error;

      // Update profile to mark as connected
      await supabase
        .from('profiles')
        .update({ n8n_webhook_connected: true })
        .eq('user_id', user.id);

      setStep('connected');
      setBacklogDuration(duration || null);
      toast({
        title: scanType === 'forward' ? 'Forward Scan Started!' : 'Backlog Scan Started!',
        description: scanType === 'forward' 
          ? 'Your inbox is now linked and will detect new invoices.'
          : `We're scanning your emails from the past ${duration} weeks for invoices.`,
      });
    } catch (error) {
      console.error('Connection error:', error);
      setStep('failed');
      toast({
        title: 'Connection Failed',
        description: 'Unable to start the scan. Please try again.',
        variant: 'destructive',
      });
    }
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
          {step === 'auth' && (
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

          {step === 'confirm' && user && (
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

          {step === 'select-scan' && user && (
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
                <Button 
                  onClick={() => handleSelectScanType('forward')} 
                  className="w-full h-auto py-4 flex flex-col items-center gap-2" 
                  size="lg"
                  variant="hero"
                >
                  <Play className="w-6 h-6" />
                  <span className="text-lg font-semibold">Forward Scan</span>
                  <span className="text-sm opacity-80 font-normal">Detect new invoices as they arrive</span>
                </Button>
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

          {step === 'select-backlog-duration' && user && (
            <Card className="border-2">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
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
                    onClick={() => handleStartScan('backfill', weeks)} 
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

          {step === 'connected' && (
            <Card className="border-2 border-green-200">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-700">
                  {selectedScanType === 'forward' ? 'Forward Scan Active!' : 'Backlog Scan Started!'}
                </CardTitle>
                <CardDescription className="text-base">
                {selectedScanType === 'forward' 
                    ? 'Your email inbox is now linked. We\'ll automatically detect new invoices from your emails.'
                    : `We're scanning your emails from the past ${backlogDuration} weeks for invoices. This may take a few minutes.`}
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
