import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Status = 'processing' | 'success' | 'error';

interface Props {
  provider: 'xero' | 'quickbooks';
}

const titleMap = {
  xero: 'Xero',
  quickbooks: 'QuickBooks',
};

const OAuthCallback = ({ provider }: Props) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('processing');
  const [message, setMessage] = useState('Finishing connection…');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const exchange = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const realmId = searchParams.get('realmId'); // QuickBooks only

      if (error) {
        setStatus('error');
        setMessage(`Authorization denied: ${error}`);
        return;
      }
      if (!code) {
        setStatus('error');
        setMessage('Missing authorization code in callback URL.');
        return;
      }
      if (provider === 'quickbooks' && !realmId) {
        setStatus('error');
        setMessage('Missing realmId in QuickBooks callback URL.');
        return;
      }

      const redirectUri = `${window.location.origin}/oauth/${provider}`;
      const fnName =
        provider === 'xero' ? 'xero-oauth-callback' : 'quickbooks-oauth-callback';

      const payload: Record<string, string> = { code, redirect_uri: redirectUri };
      if (provider === 'quickbooks' && realmId) payload.realm_id = realmId;

      const { data, error: invokeErr } = await supabase.functions.invoke(fnName, {
        body: payload,
      });

      if (invokeErr || (data && data.error)) {
        console.error('OAuth callback error:', invokeErr || data?.error);
        setStatus('error');
        setMessage(
          (data?.error as string) ||
            invokeErr?.message ||
            'Failed to complete connection.',
        );
        return;
      }

      setStatus('success');
      setMessage(`${titleMap[provider]} connected successfully.`);
      // Auto-redirect back to settings with confirmation flag
      setTimeout(() => navigate(`/settings?connected=${provider}`), 1500);
    };

    exchange();
  }, [provider, searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Helmet>
        <title>Connecting {titleMap[provider]} – InvoiceIQ</title>
      </Helmet>
      <Card className="max-w-md w-full border-2">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          {status === 'processing' && (
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
          )}
          {status === 'error' && (
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
          )}
          <h1 className="text-xl font-semibold">
            {status === 'processing' && `Connecting ${titleMap[provider]}…`}
            {status === 'success' && `${titleMap[provider]} Connected`}
            {status === 'error' && 'Connection Failed'}
          </h1>
          <p className="text-muted-foreground">{message}</p>
          {status !== 'processing' && (
            <Button onClick={() => navigate('/settings')} variant="hero">
              Back to Settings
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
