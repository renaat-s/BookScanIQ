import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Save,
  Settings as SettingsIcon,
  CheckCircle2,
  Link2,
  Unlink,
  RefreshCw,
} from 'lucide-react';

interface QbAccount {
  id: string;
  name: string;
  accountType: string;
  accountSubType: string;
  classification: string;
}

interface Credentials {
  xero_expense_account: string | null;
  xero_income_account: string | null;
  quickbooks_expense_account: string | null;
  quickbooks_income_account: string | null;
  xero_tenant_id: string | null;
  xero_organization_id: string | null;
  xero_refresh_token: string | null;
  qb_realm_id: string | null;
  quickbooks_refresh_token: string | null;
}

const Settings = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [xeroExpense, setXeroExpense] = useState('970');
  const [xeroIncome, setXeroIncome] = useState('400');
  const [qbExpense, setQbExpense] = useState('');
  const [qbIncome, setQbIncome] = useState('');

  const [qbAccounts, setQbAccounts] = useState<QbAccount[]>([]);
  const [qbAccountsLoading, setQbAccountsLoading] = useState(false);
  const [qbRoutingSaving, setQbRoutingSaving] = useState(false);

  const [xeroConnected, setXeroConnected] = useState(false);
  const [qbConnected, setQbConnected] = useState(false);
  const [xeroTenant, setXeroTenant] = useState<string | null>(null);
  const [qbRealm, setQbRealm] = useState<string | null>(null);

  const [oauthConfig, setOauthConfig] = useState<{
    xero_client_id: string | null;
    quickbooks_client_id: string | null;
    quickbooks_environment: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const fetchCredentials = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_credentials')
      .select(
        'xero_expense_account, xero_income_account, quickbooks_expense_account, quickbooks_income_account, xero_tenant_id, xero_organization_id, xero_refresh_token, qb_realm_id, quickbooks_refresh_token',
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      const creds = data as Credentials;
      setXeroExpense(creds.xero_expense_account || '970');
      setXeroIncome(creds.xero_income_account || '400');
      setQbExpense(creds.quickbooks_expense_account || '');
      setQbIncome(creds.quickbooks_income_account || '');
      setXeroConnected(!!creds.xero_refresh_token && !!creds.xero_tenant_id);
      setQbConnected(!!creds.quickbooks_refresh_token && !!creds.qb_realm_id);
      setXeroTenant(creds.xero_tenant_id);
      setQbRealm(creds.qb_realm_id);
    }
    setLoadingData(false);
  }, [user]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Fetch public OAuth client IDs once
  useEffect(() => {
    supabase.functions
      .invoke('get-oauth-config')
      .then(({ data }) => {
        if (data) setOauthConfig(data);
      })
      .catch((err) => console.error('Failed to load OAuth config:', err));
  }, []);

  // Surface a toast if we just came back from a successful OAuth round-trip
  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected === 'xero') {
      toast({
        title: 'Xero Connected',
        description: 'Your Xero organization is now linked.',
      });
    } else if (connected === 'quickbooks') {
      toast({
        title: 'QuickBooks Connected',
        description: 'Your QuickBooks company is now linked.',
      });
    }
  }, [searchParams, toast]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('user_credentials')
      .update({
        xero_expense_account: xeroExpense.trim() || '970',
        xero_income_account: xeroIncome.trim() || '400',
        quickbooks_expense_account: qbExpense.trim() || null,
        quickbooks_income_account: qbIncome.trim() || null,
      })
      .eq('user_id', user.id);

    setSaving(false);

    if (error) {
      toast({
        title: 'Save Failed',
        description: 'Could not update your accounting settings. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Settings Saved',
        description: 'Your Chart of Accounts mapping has been updated.',
      });
    }
  };

  const connectXero = () => {
    if (!oauthConfig?.xero_client_id) {
      toast({
        title: 'Configuration Missing',
        description: 'Xero client ID is not configured.',
        variant: 'destructive',
      });
      return;
    }
    const redirectUri = `${window.location.origin}/oauth/xero`;
    const scopes = [
      'openid',
      'profile',
      'email',
      'offline_access',
      'accounting.transactions',
      'accounting.contacts',
      'accounting.settings',
    ].join(' ');
    const url =
      `https://login.xero.com/identity/connect/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(oauthConfig.xero_client_id)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${encodeURIComponent(crypto.randomUUID())}`;
    window.location.href = url;
  };

  const connectQuickBooks = () => {
    if (!oauthConfig?.quickbooks_client_id) {
      toast({
        title: 'Configuration Missing',
        description: 'QuickBooks client ID is not configured.',
        variant: 'destructive',
      });
      return;
    }
    const redirectUri = `${window.location.origin}/oauth/quickbooks`;
    const scopes = ['com.intuit.quickbooks.accounting', 'openid', 'email'].join(
      ' ',
    );
    const url =
      `https://appcenter.intuit.com/connect/oauth2?client_id=${encodeURIComponent(
        oauthConfig.quickbooks_client_id,
      )}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(crypto.randomUUID())}`;
    window.location.href = url;
  };

  const disconnect = async (provider: 'xero' | 'quickbooks') => {
    if (!user) return;
    const updates =
      provider === 'xero'
        ? {
            xero_tenant_id: null,
            xero_organization_id: null,
            xero_refresh_token: null,
          }
        : {
            qb_realm_id: null,
            quickbooks_refresh_token: null,
          };
    const { error } = await supabase
      .from('user_credentials')
      .update(updates)
      .eq('user_id', user.id);
    if (error) {
      toast({
        title: 'Disconnect Failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: `${provider === 'xero' ? 'Xero' : 'QuickBooks'} Disconnected`,
      description: 'Credentials have been cleared.',
    });
    fetchCredentials();
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Account Settings - InvoiceIQ</title>
        <meta
          name="description"
          content="Manage your InvoiceIQ accounting integration settings."
        />
      </Helmet>
      <Header />

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <SettingsIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Accounting Settings</h1>
            <p className="text-muted-foreground">
              Connect your accounting software and map your Chart of Accounts
            </p>
          </div>

          {/* Xero Settings */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Xero Integration
                    {xeroConnected && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        Connected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Configure your Xero account codes for automated bookkeeping.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {xeroConnected ? (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                  <div className="text-muted-foreground">
                    Tenant ID:{' '}
                    <span className="font-mono text-foreground">
                      {xeroTenant?.slice(0, 8)}…
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnect('xero')}
                    className="text-destructive hover:text-destructive"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect Xero
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={connectXero}
                  variant="outline"
                  className="w-full"
                  disabled={!oauthConfig?.xero_client_id}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Xero
                </Button>
              )}

              <div className="space-y-2">
                <Label htmlFor="xero-expense">Expense Account Code</Label>
                <Input
                  id="xero-expense"
                  value={xeroExpense}
                  onChange={(e) => setXeroExpense(e.target.value)}
                  placeholder="970"
                />
                <p className="text-xs text-muted-foreground">Default: 970</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="xero-income">Income Account Code</Label>
                <Input
                  id="xero-income"
                  value={xeroIncome}
                  onChange={(e) => setXeroIncome(e.target.value)}
                  placeholder="400"
                />
                <p className="text-xs text-muted-foreground">Default: 400</p>
              </div>
            </CardContent>
          </Card>

          {/* QuickBooks Settings */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    QuickBooks Integration
                    {qbConnected && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        Connected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Configure your QuickBooks account codes for automated
                    bookkeeping.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {qbConnected ? (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                  <div className="text-muted-foreground">
                    Realm ID:{' '}
                    <span className="font-mono text-foreground">
                      {qbRealm}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnect('quickbooks')}
                    className="text-destructive hover:text-destructive"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect QuickBooks
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={connectQuickBooks}
                  variant="outline"
                  className="w-full"
                  disabled={!oauthConfig?.quickbooks_client_id}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect QuickBooks
                </Button>
              )}

              <div className="space-y-2">
                <Label htmlFor="qb-expense">Expense Account Code</Label>
                <Input
                  id="qb-expense"
                  value={qbExpense}
                  onChange={(e) => setQbExpense(e.target.value)}
                  placeholder="EXP"
                />
                <p className="text-xs text-muted-foreground">Default: EXP</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qb-income">Income Account Code</Label>
                <Input
                  id="qb-income"
                  value={qbIncome}
                  onChange={(e) => setQbIncome(e.target.value)}
                  placeholder="INC"
                />
                <p className="text-xs text-muted-foreground">Default: INC</p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size="lg"
            variant="hero"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
