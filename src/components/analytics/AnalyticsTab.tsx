import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canUseAdvancedAnalytics } from "@/lib/stripe-plans";
import { useScanUsage } from "@/hooks/useScanUsage";
import { useLedgerLog } from "@/hooks/useLedgerLog";
import BasicAnalytics from "./BasicAnalytics";
import AdvancedAnalytics from "./AdvancedAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, RefreshCw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AnalyticsTab = () => {
  const { subscription } = useAuth();
  const navigate = useNavigate();
  const usage = useScanUsage();
  const { entries, loading, syncing, sync } = useLedgerLog();

  const advanced = subscription.isDeveloper || canUseAdvancedAnalytics(subscription.tier);

  const monthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Analytics
          </h2>
          <p className="text-xs text-muted-foreground">
            {advanced ? "Advanced analytics · full history" : "Basic analytics · current month"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => sync(true)} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          Refresh log
        </Button>
      </div>

      <BasicAnalytics entries={entries} monthKey={monthKey} usage={usage} />

      {advanced ? (
        <AdvancedAnalytics entries={entries} />
      ) : (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Unlock Advanced Analytics</h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Get 6-month trends, category spend breakdowns, uncategorized rate over time,
                  full scan history, and sync status per accounting platform.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/pricing")}>Upgrade to Professional</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsTab;
