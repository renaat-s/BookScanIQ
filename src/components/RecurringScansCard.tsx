import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import { canUseAdvancedAnalytics } from '@/lib/stripe-plans';
import {
  computeNextRun,
  describeSchedule,
  DAY_NAMES,
  LOOKBACK_OPTIONS,
  type ScanFrequency,
} from '@/lib/scan-schedule';
import { CalendarClock, Loader2, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ScheduleState {
  enabled: boolean;
  frequency: ScanFrequency;
  dayOfWeek: number;
  hourUtc: number;
  lookbackWeeks: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
}

const DEFAULTS: ScheduleState = {
  enabled: false,
  frequency: 'weekly',
  dayOfWeek: 1,
  hourUtc: 7,
  lookbackWeeks: 4,
  lastRunAt: null,
  nextRunAt: null,
  lastStatus: null,
  lastError: null,
};

const formatWhen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;

const RecurringScansCard = () => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [state, setState] = useState<ScheduleState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isPaid = subscription.subscribed || subscription.isDeveloper;
  const dailyUnlocked = subscription.isDeveloper || canUseAdvancedAnalytics(subscription.tier);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('scan_schedules')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setState({
        enabled: data.enabled,
        frequency: data.frequency as ScanFrequency,
        dayOfWeek: data.day_of_week,
        hourUtc: data.hour_utc,
        lookbackWeeks: data.lookback_weeks,
        lastRunAt: data.last_run_at,
        nextRunAt: data.next_run_at,
        lastStatus: data.last_status,
        lastError: data.last_error,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (next: ScheduleState) => {
    if (!user) return;
    setSaving(true);
    const nextRun = next.enabled
      ? computeNextRun(next.frequency, next.dayOfWeek, next.hourUtc).toISOString()
      : null;

    const { error } = await supabase.from('scan_schedules').upsert(
      {
        user_id: user.id,
        enabled: next.enabled,
        frequency: next.frequency,
        day_of_week: next.dayOfWeek,
        hour_utc: next.hourUtc,
        lookback_weeks: next.lookbackWeeks,
        next_run_at: nextRun,
      },
      { onConflict: 'user_id' },
    );
    setSaving(false);

    if (error) {
      toast({
        title: 'Could not save schedule',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setState({ ...next, nextRunAt: nextRun });
    toast({
      title: next.enabled ? 'Automatic scans on' : 'Automatic scans off',
      description: next.enabled
        ? `${describeSchedule(next.frequency, next.dayOfWeek, next.hourUtc)}.`
        : 'Your inbox will only be scanned when you start a scan manually.',
    });
  };

  if (!isPaid) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-500" /> Recurring Auto-Scans
          </CardTitle>
          <CardDescription>
            Let InvoiceIQ scan your inbox on a schedule so invoices file themselves. Available on
            any paid plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate('/pricing')}>
            View plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant hover:shadow-lg hover:border-violet-500/30 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-violet-500" /> Recurring Auto-Scans
          {state.enabled && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" /> Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Scan your inbox automatically on a schedule. Each run counts towards your monthly scan
          allowance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="auto-scan-toggle" className="text-sm font-medium">
                  Run scans automatically
                </Label>
                <p className="text-xs text-muted-foreground">
                  {describeSchedule(state.frequency, state.dayOfWeek, state.hourUtc)}
                </p>
              </div>
              <Switch
                id="auto-scan-toggle"
                checked={state.enabled}
                disabled={saving}
                onCheckedChange={(checked) => persist({ ...state, enabled: checked })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Frequency</Label>
                <Select
                  value={state.frequency}
                  onValueChange={(v) => persist({ ...state, frequency: v as ScanFrequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="daily" disabled={!dailyUnlocked}>
                      Daily {dailyUnlocked ? '' : '(Professional +)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Time (UTC)</Label>
                <Select
                  value={String(state.hourUtc)}
                  onValueChange={(v) => persist({ ...state, hourUtc: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, h) => (
                      <SelectItem key={h} value={String(h)}>
                        {String(h).padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {state.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label className="text-sm">Day</Label>
                  <Select
                    value={String(state.dayOfWeek)}
                    onValueChange={(v) => persist({ ...state, dayOfWeek: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES.map((name, i) => (
                        <SelectItem key={name} value={String(i)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm">Look back</Label>
                <Select
                  value={String(state.lookbackWeeks)}
                  onValueChange={(v) => persist({ ...state, lookbackWeeks: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOOKBACK_OPTIONS.map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        {w} week{w > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 space-y-1 text-sm">
              <p className="text-muted-foreground">
                Next run:{' '}
                <span className="text-foreground font-medium">
                  {state.enabled ? formatWhen(state.nextRunAt) ?? 'Scheduling...' : 'Paused'}
                </span>
              </p>
              <p className="text-muted-foreground">
                Last run:{' '}
                <span className="text-foreground font-medium">
                  {formatWhen(state.lastRunAt) ?? 'Never'}
                </span>
                {state.lastStatus ? ` (${state.lastStatus})` : ''}
              </p>
              {state.lastStatus === 'failed' && state.lastError && (
                <p className="flex items-start gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{state.lastError}</span>
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringScansCard;
