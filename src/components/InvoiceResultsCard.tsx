import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, FileText, Loader2, InboxIcon } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_vendor: string | null;
  invoice_total: string | null;
  invoice_date: string | null;
  invoice_number: string | null;
  invoice_category: string | null;
  invoice_type: string | null;
  web_view_link: string | null;
}

interface InvoiceResultsCardProps {
  jobId: string;
  onBack: () => void;
  onHome: () => void;
}

export const InvoiceResultsCard = ({ jobId, onBack, onHome }: InvoiceResultsCardProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_vendor, invoice_total, invoice_date, invoice_number, invoice_category, invoice_type, web_view_link')
        .eq('scan_job_id', jobId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvoices(data);
      }
      setLoading(false);
    };

    fetchInvoices();
  }, [jobId]);

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="border-2 border-muted">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <InboxIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">No Invoices Found</CardTitle>
          <CardDescription className="text-base">
            The scan completed successfully but no invoices were detected in the scanned emails. 
            Try scanning a longer time range or check that your inbox contains invoice-related emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={onBack} variant="hero" className="w-full" size="lg">
            Scan Again
          </Button>
          <Button onClick={onHome} variant="outline" className="w-full" size="lg">
            Return to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/30">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl text-primary">
            {invoices.length} Invoice{invoices.length !== 1 ? 's' : ''} Found
          </CardTitle>
          <CardDescription className="text-base">
            These invoices were detected and filed to your Google Drive.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {invoices.map((inv) => (
          <Card key={inv.id} className="border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      {inv.invoice_vendor || 'Unknown Vendor'}
                    </span>
                    {inv.invoice_type && (
                      <Badge variant={inv.invoice_type === 'Income' ? 'default' : 'secondary'}>
                        {inv.invoice_type}
                      </Badge>
                    )}
                    {inv.invoice_category && (
                      <Badge variant="outline">{inv.invoice_category}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {inv.invoice_total && (
                      <span className="font-medium text-foreground text-base">
                        ${inv.invoice_total}
                      </span>
                    )}
                    {inv.invoice_date && <span>{inv.invoice_date}</span>}
                    {inv.invoice_number && <span>#{inv.invoice_number}</span>}
                  </div>
                </div>
                {inv.web_view_link && (
                  <a
                    href={inv.web_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        <Button onClick={onBack} variant="outline" className="w-full" size="lg">
          Run Another Scan
        </Button>
        <Button onClick={onHome} variant="ghost" className="w-full" size="sm">
          Return to Home
        </Button>
      </div>
    </div>
  );
};
