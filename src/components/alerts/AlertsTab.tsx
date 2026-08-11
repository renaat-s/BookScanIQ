import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Copy, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAlerts } from "@/hooks/useAlerts";
import { canUseAdvancedAnalytics } from "@/lib/stripe-plans";
import { AlertCard } from "./AlertCard";

export function AlertsTab() {
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const { duplicates, anomalies, dismissedCount, loading, dismiss, restoreAll } = useAlerts();

  const anomaliesUnlocked =
    subscription.isDeveloper || canUseAdvancedAnalytics(subscription.tier);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Checking your ledger for duplicates and unusual spending...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Alerts</h3>
          <p className="text-sm text-muted-foreground">
            Duplicate invoices and unusual spending from the last 6 months.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Copy className="w-3.5 h-3.5" /> {duplicates.length} duplicate
            {duplicates.length === 1 ? "" : "s"}
          </Badge>
          {anomaliesUnlocked && (
            <Badge variant="secondary" className="gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {anomalies.length} anomal
              {anomalies.length === 1 ? "y" : "ies"}
            </Badge>
          )}
          {dismissedCount > 0 && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={restoreAll}>
              <RefreshCw className="w-4 h-4" /> Restore dismissed
            </Button>
          )}
        </div>
      </div>

      {duplicates.length === 0 && (!anomaliesUnlocked || anomalies.length === 0) && (
        <Card className="p-10 text-center space-y-2">
          <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500" />
          <p className="font-semibold">No issues found</p>
          <p className="text-sm text-muted-foreground">Your ledger looks clean.</p>
        </Card>
      )}

      {duplicates.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Possible duplicates
          </h4>
          {duplicates.map((a) => (
            <AlertCard key={a.key} alert={a} onDismiss={dismiss} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Spend anomalies
        </h4>
        {anomaliesUnlocked ? (
          anomalies.length > 0 ? (
            anomalies.map((a) => <AlertCard key={a.key} alert={a} onDismiss={dismiss} />)
          ) : (
            <Card className="p-6 text-sm text-muted-foreground">
              No unusual spending detected this month.
            </Card>
          )
        ) : (
          <Card className="p-6 flex flex-wrap items-center justify-between gap-4 border-dashed">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Spend anomaly alerts are a Pro feature</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a vendor costs far more than usual.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate("/pricing")}>
              Upgrade plan
            </Button>
          </Card>
        )}
      </section>
    </div>
  );
}

export default AlertsTab;
