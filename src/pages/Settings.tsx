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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  Trash2,
  ShieldOff,
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
  const { user, loading, signOut, deleteAccount } = useAuth();
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
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

  const loadQbAccounts = useCallback(
    async (silent = false) => {
      if (!qbConnected) return;
      setQbAccountsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          'quickbooks-list-accounts',
        );
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setQbAccounts(data?.accounts ?? []);
        if (!silent) {
          toast({
            title: 'Accounts Loaded',
            description: `Loaded ${data?.accounts?.length ?? 0} QuickBooks accounts.`,
          });
        }
      } catch (err) {
        console.error('Failed to load QB accounts:', err);
        if (!silent) {
          toast({
            title: 'Failed to Load Accounts',
            description:
              (err as Error).message ||
              'Could not fetch your QuickBooks Chart of Accounts.',
            variant: 'destructive',
          });
        }
      } finally {
        setQbAccountsLoading(false);
      }
    },
    [qbConnected, toast],
  );

  // Auto-load QB accounts once we know QB is connected
  useEffect(() => {
    if (qbConnected && qbAccounts.length === 0 && !qbAccountsLoading) {
      loadQbAccounts(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qbConnected]);

  const saveQbRouting = async () => {
    if (!user) return;
    if (!qbExpense || !qbIncome) {
      toast({
        title: 'Select Both Accounts',
        description:
          'Please choose a default Expense and Income account before saving.',
        variant: 'destructive',
      });
      return;
    }
    setQbRoutingSaving(true);
    const { error } = await supabase
      .from('user_credentials')
      .update({
        quickbooks_expense_account: qbExpense,
        quickbooks_income_account: qbIncome,
      })
      .eq('user_id', user.id);
    setQbRoutingSaving(false);
    if (error) {
      toast({
        title: 'Save Failed',
        description: 'Could not update QuickBooks routing. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Routing Saved',
        description: 'Your QuickBooks transaction routing is now active.',
      });
    }
  };


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
      'accounting.attachments',
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

  const disconnectGoogle = async () => {
    if (!user) return;
    setDisconnectingGoogle(true);
    try {
      const { error } = await supabase
        .from('user_credentials')
        .update({ google_refresh_token: null })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({
        title: 'Google Disconnected',
        description:
          'InvoiceIQ no longer has access to your Gmail, Drive, or Sheets. You may also revoke access from your Google Account permissions page.',
      });
      await signOut();
    } catch (err) {
      toast({
        title: 'Disconnect Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    const { error } = await deleteAccount();
    if (error) {
      toast({
        title: 'Deletion Failed',
        description: error.message,
        variant: 'destructive',
      });
      setDeletingAccount(false);
      return;
    }
    toast({
      title: 'Account Deleted',
      description: 'Your account and stored data have been permanently removed.',
    });
    navigate('/');
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

      <main className="bg-gradient-subtle">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto space-y-10">
            <div className="text-center space-y-5">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-elegant flex items-center justify-center">
                <SettingsIcon className="w-9 h-9 text-violet-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground leading-tight py-1">
                Accounting Settings
              </h1>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
              <p className="text-lg text-muted-foreground font-light tracking-[-0.005em] max-w-md mx-auto leading-relaxed">
                Connect your accounting software and map your Chart of Accounts
              </p>
            </div>

            {/* Xero Settings */}
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant hover:shadow-lg hover:border-violet-500/30 transition-all duration-300">
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
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant hover:shadow-lg hover:border-violet-500/30 transition-all duration-300">
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

              {qbConnected && (
                <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold">
                        Transaction Routing
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Choose which QuickBooks accounts new invoices should
                        post to. Saved as the account's internal ID.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => loadQbAccounts(false)}
                      disabled={qbAccountsLoading}
                    >
                      {qbAccountsLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qb-expense">Default Expense Account</Label>
                    <Select
                      value={qbExpense || undefined}
                      onValueChange={setQbExpense}
                      disabled={qbAccountsLoading || qbAccounts.length === 0}
                    >
                      <SelectTrigger id="qb-expense">
                        <SelectValue
                          placeholder={
                            qbAccountsLoading
                              ? 'Loading accounts…'
                              : qbAccounts.length === 0
                                ? 'No accounts loaded'
                                : 'Select an expense account'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {qbAccounts.map((acc) => (
                          <SelectItem key={`exp-${acc.id}`} value={acc.id}>
                            <span className="font-medium">{acc.name}</span>
                            {acc.accountType && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {acc.accountType}
                              </span>
                            )}
                            <span className="ml-2 text-xs text-muted-foreground">
                              · ID {acc.id}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {qbExpense && (
                      <p className="text-xs text-muted-foreground">
                        Saved ID:{' '}
                        <span className="font-mono text-foreground">
                          {qbExpense}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qb-income">Default Income Account</Label>
                    <Select
                      value={qbIncome || undefined}
                      onValueChange={setQbIncome}
                      disabled={qbAccountsLoading || qbAccounts.length === 0}
                    >
                      <SelectTrigger id="qb-income">
                        <SelectValue
                          placeholder={
                            qbAccountsLoading
                              ? 'Loading accounts…'
                              : qbAccounts.length === 0
                                ? 'No accounts loaded'
                                : 'Select an income account'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {qbAccounts.map((acc) => (
                          <SelectItem key={`inc-${acc.id}`} value={acc.id}>
                            <span className="font-medium">{acc.name}</span>
                            {acc.accountType && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {acc.accountType}
                              </span>
                            )}
                            <span className="ml-2 text-xs text-muted-foreground">
                              · ID {acc.id}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {qbIncome && (
                      <p className="text-xs text-muted-foreground">
                        Saved ID:{' '}
                        <span className="font-mono text-foreground">
                          {qbIncome}
                        </span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={saveQbRouting}
                    disabled={
                      qbRoutingSaving || !qbExpense || !qbIncome
                    }
                    className="w-full"
                  >
                    {qbRoutingSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Routing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy & Account Controls */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldOff className="w-5 h-5 text-violet-500" />
                Privacy & Account Controls
              </CardTitle>
              <CardDescription>
                Revoke Google access or permanently delete your InvoiceIQ
                account and data. Read more in our{' '}
                <a href="/privacy" className="text-violet-500 hover:underline">
                  Privacy Policy
                </a>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-border/50 p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-foreground">Disconnect Google</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Revokes InvoiceIQ's access to your Gmail, Drive, and Sheets. We will clear the stored Google refresh token and sign you out. You can also revoke access from your{' '}
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-500 hover:underline"
                    >
                      Google Account permissions page
                    </a>
                    .
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={disconnectingGoogle}>
                      {disconnectingGoogle ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Unlink className="w-4 h-4 mr-2" />
                      )}
                      Disconnect Google
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect Google?</AlertDialogTitle>
                      <AlertDialogDescription>
                        InvoiceIQ will no longer be able to scan your inbox or write to your Drive and Sheets. Files already saved in your own Google Drive will not be deleted. You will be signed out and can reconnect anytime.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={disconnectGoogle}>Disconnect</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="rounded-lg border border-destructive/30 p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-destructive">Delete My Account & Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently deletes your InvoiceIQ profile, stored Google/Xero/QuickBooks tokens, scan history, and invoice metadata from our servers. This action is irreversible.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Note:</strong> Files already saved into your own Google Drive and entries written into your own Google Sheets will <strong>not</strong> be deleted — they belong to you and remain in your Google account.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deletingAccount}>
                      {deletingAccount ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete My Account & Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove your account and all associated data from InvoiceIQ's servers (profile, stored OAuth tokens, scan jobs, invoice metadata). It cannot be undone. Files in your own Google Drive will not be touched.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, delete everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <p className="text-xs text-muted-foreground">
                For privacy inquiries, contact{' '}
                <a href="mailto:info@invoice-iq.com" className="text-violet-500 hover:underline">
                  info@invoice-iq.com
                </a>
                .
              </p>
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
