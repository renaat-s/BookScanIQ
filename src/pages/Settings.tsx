import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [xeroExpense, setXeroExpense] = useState('970');
  const [xeroIncome, setXeroIncome] = useState('400');
  const [qbExpense, setQbExpense] = useState('EXP');
  const [qbIncome, setQbIncome] = useState('INC');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchCredentials = async () => {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('xero_expense_account, xero_income_account, quickbooks_expense_account, quickbooks_income_account')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setXeroExpense(data.xero_expense_account || '970');
        setXeroIncome(data.xero_income_account || '400');
        setQbExpense(data.quickbooks_expense_account || 'EXP');
        setQbIncome(data.quickbooks_income_account || 'INC');
      }
      setLoadingData(false);
    };

    fetchCredentials();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('user_credentials')
      .update({
        xero_expense_account: xeroExpense.trim() || '970',
        xero_income_account: xeroIncome.trim() || '400',
        quickbooks_expense_account: qbExpense.trim() || 'EXP',
        quickbooks_income_account: qbIncome.trim() || 'INC',
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
        <meta name="description" content="Manage your InvoiceIQ accounting integration settings." />
      </Helmet>
      <Header />

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <SettingsIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Accounting Settings</h1>
            <p className="text-muted-foreground">Map InvoiceIQ to your Chart of Accounts</p>
          </div>

          {/* Xero Settings */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Xero Integration</CardTitle>
              <CardDescription>Configure your Xero account codes for automated bookkeeping.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <CardTitle className="text-lg">QuickBooks Integration</CardTitle>
              <CardDescription>Configure your QuickBooks account codes for automated bookkeeping.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg" variant="hero">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
