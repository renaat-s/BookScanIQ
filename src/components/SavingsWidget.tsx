import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, DollarSign, Check, Pencil } from "lucide-react";
import { PLANS } from "@/lib/stripe-plans";

interface Props {
  documentsThisMonth: number;
}

const HOURLY_RATE = 35; // assumed bookkeeping hourly value (USD)

const planMonthlyCost = (tier: string | null): number => {
  if (!tier) return 0;
  const plan = PLANS.find((p) => p.name.toLowerCase() === tier.toLowerCase());
  if (!plan) return 0;
  return Number(plan.monthlyPrice.replace(/[^0-9.]/g, "")) || 0;
};

const SavingsWidget = ({ documentsThisMonth }: Props) => {
  const { user } = useAuth();
  const [minutesPerDoc, setMinutesPerDoc] = useState<number>(5);
  const [editing, setEditing] = useState(false);
  const [draftMinutes, setDraftMinutes] = useState<string>("5");
  const [saving, setSaving] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("minutes_per_doc")
        .eq("user_id", user.id)
        .maybeSingle();
      const m = (data as { minutes_per_doc?: number } | null)?.minutes_per_doc ?? 5;
      setMinutesPerDoc(m);
      setDraftMinutes(String(m));
    })();
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("check-subscription");
        if (data?.tier) setTier(data.tier);
        if (data?.is_developer) setIsDev(true);
      } catch {/* silent */}
    })();
  }, [user]);

  const saveMinutes = async () => {
    if (!user) return;
    const n = Math.max(1, Math.min(120, parseInt(draftMinutes, 10) || 5));
    setSaving(true);
    await supabase.from("profiles").update({ minutes_per_doc: n }).eq("user_id", user.id);
    setMinutesPerDoc(n);
    setEditing(false);
    setSaving(false);
  };

  const totalMinutes = documentsThisMonth * minutesPerDoc;
  const hoursSaved = totalMinutes / 60;
  const dollarValue = hoursSaved * HOURLY_RATE;
  const planCost = isDev ? 0 : planMonthlyCost(tier);
  const roi = planCost > 0 ? dollarValue / planCost : null;
  const netSavings = dollarValue - planCost;

  return (
    <Card className="border-border/60 shadow-card overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Your Savings This Month</p>
              <p className="text-xs text-muted-foreground">Honest ROI vs. your plan</p>
            </div>
          </div>
          {roi !== null && roi >= 1 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
              <Check className="w-3 h-3" /> {roi.toFixed(1)}× ROI
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <Metric
            label="Documents"
            value={String(documentsThisMonth)}
            sub="this month"
          />
          <Metric
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Hours saved"
            value={hoursSaved.toFixed(1)}
            sub={`@ ${minutesPerDoc} min/doc`}
          />
          <Metric
            icon={<DollarSign className="w-3.5 h-3.5" />}
            label="Value"
            value={`$${Math.round(dollarValue).toLocaleString()}`}
            sub={`@ $${HOURLY_RATE}/hr`}
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
          <div className="text-xs text-muted-foreground">
            {planCost > 0 ? (
              <>
                Plan cost <span className="font-semibold text-foreground">${planCost}/mo</span>
                {netSavings >= 0 ? (
                  <> · Net savings <span className="font-semibold text-success">+${Math.round(netSavings).toLocaleString()}</span></>
                ) : (
                  <> · Below breakeven by <span className="font-semibold text-destructive">${Math.round(-netSavings)}</span></>
                )}
              </>
            ) : isDev ? (
              <>Developer account · plan cost $0</>
            ) : (
              <>No active plan — savings shown vs. $0 cost</>
            )}
          </div>
          {!editing ? (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditing(true)}>
              <Pencil className="w-3 h-3" /> Adjust
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={1}
                max={120}
                value={draftMinutes}
                onChange={(e) => setDraftMinutes(e.target.value)}
                className="h-7 w-16 text-xs"
              />
              <span className="text-xs text-muted-foreground">min/doc</span>
              <Button size="sm" className="h-7 px-2 text-xs" onClick={saveMinutes} disabled={saving}>
                Save
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Metric = ({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) => (
  <div className="rounded-lg bg-muted/40 border border-border/40 p-3">
    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
      {icon} {label}
    </div>
    <p className="text-lg sm:text-xl font-bold tabular-nums mt-0.5">{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
  </div>
);

export default SavingsWidget;
