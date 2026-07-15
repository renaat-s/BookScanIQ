import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FolderOpen, FileSpreadsheet, ExternalLink, Loader2,
  RefreshCw, Receipt, AlertCircle, Plug,
} from "lucide-react";
import DriveBrowser from "@/components/DriveBrowser";
import SheetLedger from "@/components/SheetLedger";
import { useNavigate } from "react-router-dom";

interface Credentials {
  root_folder_id: string | null;
  user_spreadsheet_id: string | null;
  xero_refresh_token: string | null;
  xero_tenant_id: string | null;
  xero_organization_id: string | null;
  quickbooks_refresh_token: string | null;
  qb_realm_id: string | null;
}

interface ExternalTxn {
  id: string;
  number: string | null;
  contact: string | null;
  date: string | null;
  due_date: string | null;
  total: number | null;
  status: string | null;
  type: string | null;
  currency: string | null;
  balance?: number | null;
  amount_due?: number | null;
}

const fmtMoney = (n: number | null | undefined, cur?: string | null) => {
  if (n == null || isNaN(n)) return "-";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: cur || "USD",
    maximumFractionDigits: 2,
  });
};

const WorkspacesTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [loadingCreds, setLoadingCreds] = useState(true);

  const [xero, setXero] = useState<ExternalTxn[] | null>(null);
  const [xeroLoading, setXeroLoading] = useState(false);
  const [xeroError, setXeroError] = useState<string | null>(null);

  const [qb, setQb] = useState<ExternalTxn[] | null>(null);
  const [qbLoading, setQbLoading] = useState(false);
  const [qbError, setQbError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingCreds(true);
      const { data } = await supabase
        .from("user_credentials")
        .select(
          "root_folder_id, user_spreadsheet_id, xero_refresh_token, xero_tenant_id, xero_organization_id, quickbooks_refresh_token, qb_realm_id"
        )
        .eq("user_id", user.id)
        .single();
      setCreds(data as Credentials);
      setLoadingCreds(false);
    })();
  }, [user]);

  const driveFolderEmbed = useMemo(
    () =>
      creds?.root_folder_id
        ? `https://drive.google.com/embeddedfolderview?id=${creds.root_folder_id}#grid`
        : null,
    [creds]
  );
  const sheetEmbed = useMemo(
    () =>
      creds?.user_spreadsheet_id
        ? `https://docs.google.com/spreadsheets/d/${creds.user_spreadsheet_id}/preview?rm=minimal&widget=true&headers=false`
        : null,
    [creds]
  );

  const loadXero = useCallback(async () => {
    setXeroLoading(true);
    setXeroError(null);
    try {
      const { data, error } = await supabase.functions.invoke("xero-list-transactions");
      if (error) throw error;
      if (data?.error) setXeroError(data.error);
      setXero(data?.transactions ?? []);
    } catch (e) {
      setXeroError(e instanceof Error ? e.message : "Failed to load Xero data");
      setXero([]);
    } finally {
      setXeroLoading(false);
    }
  }, []);

  const loadQb = useCallback(async () => {
    setQbLoading(true);
    setQbError(null);
    try {
      const { data, error } = await supabase.functions.invoke("quickbooks-list-transactions");
      if (error) throw error;
      if (data?.error) setQbError(data.error);
      setQb(data?.transactions ?? []);
    } catch (e) {
      setQbError(e instanceof Error ? e.message : "Failed to load QuickBooks data");
      setQb([]);
    } finally {
      setQbLoading(false);
    }
  }, []);

  // Auto-load when credentials confirm connection (once per session)
  const xeroReady = !!(creds?.xero_refresh_token && creds?.xero_tenant_id);
  const qbReady = !!(creds?.quickbooks_refresh_token && creds?.qb_realm_id);
  useEffect(() => {
    if (xeroReady && xero === null) loadXero();
  }, [xeroReady, xero, loadXero]);
  useEffect(() => {
    if (qbReady && qb === null) loadQb();
  }, [qbReady, qb, loadQb]);

  if (loadingCreds) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Plug className="w-4 h-4 text-primary" />
          Live Workspaces
        </CardTitle>
        <CardDescription className="text-xs">
          View your Drive directory, Sheet ledger, and accounting transactions live, all without leaving InvoiceIQ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="drive" className="space-y-4">
          <TabsList className="w-full sm:w-auto overflow-x-auto bg-muted/60 backdrop-blur">
            <TabsTrigger value="drive" className="gap-1.5">
              <FolderOpen className="w-4 h-4" /> Drive
            </TabsTrigger>
            <TabsTrigger value="sheet" className="gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> Ledger
            </TabsTrigger>
            <TabsTrigger value="xero" className="gap-1.5">
              <Receipt className="w-4 h-4" /> Xero
            </TabsTrigger>
            <TabsTrigger value="quickbooks" className="gap-1.5">
              <Receipt className="w-4 h-4" /> QuickBooks
            </TabsTrigger>
          </TabsList>

          {/* DRIVE */}
          <TabsContent value="drive" className="m-0">
            {!creds?.root_folder_id ? (
              <NotConnected
                icon={<FolderOpen className="w-8 h-8" />}
                title="Drive directory not synced yet"
                desc="Sync your workspace to browse your InvoiceIQ folder live here."
                cta="Sync workspace"
                onClick={() => navigate("/detect-invoices")}
              />
            ) : (
              <DriveBrowser rootFolderId={creds.root_folder_id} />
            )}
          </TabsContent>

          {/* SHEET */}
          <TabsContent value="sheet" className="m-0">
            {!creds?.user_spreadsheet_id ? (
              <NotConnected
                icon={<FileSpreadsheet className="w-8 h-8" />}
                title="Ledger spreadsheet not synced yet"
                desc="Sync your workspace to view your InvoiceIQ Ledger live here."
                cta="Sync workspace"
                onClick={() => navigate("/detect-invoices")}
              />
            ) : (
              <SheetLedger />
            )}
          </TabsContent>

          {/* XERO */}
          <TabsContent value="xero" className="m-0">
            <ExternalTxnsView
              providerLabel="Xero"
              connected={!!(creds?.xero_refresh_token && creds?.xero_tenant_id)}
              loading={xeroLoading}
              error={xeroError}
              transactions={xero}
              onRefresh={loadXero}
              onConnect={() => navigate("/settings")}
            />
          </TabsContent>

          {/* QUICKBOOKS */}
          <TabsContent value="quickbooks" className="m-0">
            <ExternalTxnsView
              providerLabel="QuickBooks"
              connected={!!(creds?.quickbooks_refresh_token && creds?.qb_realm_id)}
              loading={qbLoading}
              error={qbError}
              transactions={qb}
              onRefresh={loadQb}
              onConnect={() => navigate("/settings")}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const NotConnected = ({
  icon, title, desc, cta, onClick,
}: { icon: React.ReactNode; title: string; desc: string; cta: string; onClick: () => void }) => (
  <div className="py-12 text-center space-y-3 border border-dashed border-border/60 rounded-xl">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-primary text-white flex items-center justify-center shadow-elegant">
      {icon}
    </div>
    <div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{desc}</p>
    </div>
    <Button onClick={onClick} className="gap-2">{cta}</Button>
  </div>
);

const ExternalTxnsView = ({
  providerLabel, connected, loading, error, transactions, onRefresh, onConnect,
}: {
  providerLabel: string;
  connected: boolean;
  loading: boolean;
  error: string | null;
  transactions: ExternalTxn[] | null;
  onRefresh: () => void;
  onConnect: () => void;
}) => {
  if (!connected) {
    return (
      <NotConnected
        icon={<Plug className="w-8 h-8" />}
        title={`${providerLabel} not connected`}
        desc={`Connect your ${providerLabel} account to view transactions here in real time.`}
        cta={`Connect ${providerLabel}`}
        onClick={onConnect}
      />
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live · {providerLabel}
        </Badge>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      <div className="rounded-xl border border-border/60 overflow-x-auto">
        {loading && !transactions ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No transactions returned from {providerLabel} yet.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.number || "-"}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">
                    {t.contact || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {t.date ? new Date(t.date).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {t.status ? <Badge variant="outline">{t.status}</Badge> : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {fmtMoney(t.total, t.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default WorkspacesTab;
