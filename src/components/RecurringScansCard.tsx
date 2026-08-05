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
  localToUtc,
  utcToLocal,
  DAY_NAMES,
  BACKLOG_OPTIONS,
  TIMEZONES,
  type ScanFrequency,
} from '@/lib/scan-schedule';
import { CalendarClock, Loader2, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ScheduleState {
  enabled: boolean;
  frequency: ScanFrequency;
  /** Day + hour as the user sees them, in `timezone`. */
  dayLocal: number;
  hourLocal: number;
  timezone: string;
  backlogWeeks: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
}

const guessTimezone = () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TIMEZONES.some((t) => t.value === tz) ? tz : 'UTC';
};

const DEFAULTS: ScheduleState = {
  enabled: false,
  frequency: 'weekly',
  dayLocal: 1,
  hourLocal: 7,
  timezone: 'UTC',
  backlogWeeks: 4,
  lastRunAt: null,
  nextRunAt: null,
  lastStatus: null,
  lastError: null,
};

const STATUS_LABELS: Record<string, string> = {
  running: 'running',
  success: 'success',
  success_last_scan: 'success, last scan on plan',
  blocked: 'skipped, allowance reached',
  failed: 'failed',
};

const formatWhen = (iso: string | null, timeZone: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone,
      })
    : null;


const RecurringScansCard = () => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [state, setState] = useState<ScheduleState>({ ...DEFAULTS, timezone: guessTimezone() });
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
      const timezone = (data as { timezone?: string }).timezone || 'UTC';
      const { hourLocal, dayLocal } = utcToLocal(data.hour_utc, data.day_of_week, timezone);
      setState({
        enabled: data.enabled,
        frequency: data.frequency as ScanFrequency,
        dayLocal,
        hourLocal,
        timezone,
        backlogWeeks: data.lookback_weeks,
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

    const { hourUtc, dayUtc } = localToUtc(next.hourLocal, next.dayLocal, next.timezone);
    const nextRun = next.enabled
      ? computeNextRun(next.frequency, dayUtc, hourUtc).toISOString()
      : null;

    const { error } = await supabase.from('scan_schedules').upsert(
      {
        user_id: user.id,
        enabled: next.enabled,
        frequency: next.frequency,
        day_of_week: dayUtc,
        hour_utc: hourUtc,
        timezone: next.timezone,
        lookback_weeks: next.backlogWeeks,
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
        ? `${describeSchedule(next.frequency, next.dayLocal, next.hourLocal, next.timezone)}.`
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
            {usage.cap !== null && !usage.loading && (
              <div
                className={`rounded-2xl border p-4 text-sm space-y-1 ${
                  usage.atCap
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : usage.cap - usage.used <= 1 || usage.nearCap
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-border/50 bg-muted/30 text-muted-foreground'
                }`}
              >
                <p className="font-medium">
                  {usage.atCap
                    ? 'Monthly allowance reached'
                    : usage.cap - usage.used === 1
                    ? 'Only 1 document left this month'
                    : `${usage.cap - usage.used} of ${usage.cap} documents left this month`}
                </p>
                <p className="text-xs opacity-90">
                  {usage.atCap
                    ? 'Scheduled scans are skipped until your allowance resets next month.'
                    : 'Scheduled runs deduct as documents are filed and stop the moment the allowance runs out.'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="auto-scan-toggle" className="text-sm font-medium">
                  Run scans automatically
                </Label>
                <p className="text-xs text-muted-foreground">
                  {describeSchedule(state.frequency, state.dayLocal, state.hourLocal, state.timezone)}
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
                <Label className="text-sm">Timezone</Label>
                <Select
                  value={state.timezone}
                  onValueChange={(v) => persist({ ...state, timezone: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Time</Label>
                <Select
                  value={String(state.hourLocal)}
                  onValueChange={(v) => persist({ ...state, hourLocal: Number(v) })}
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
                    value={String(state.dayLocal)}
                    onValueChange={(v) => persist({ ...state, dayLocal: Number(v) })}
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
                <Label className="text-sm">Backlog</Label>
                <Select
                  value={String(state.backlogWeeks)}
                  onValueChange={(v) => persist({ ...state, backlogWeeks: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKLOG_OPTIONS.map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        {w} weeks
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
                  {state.enabled
                    ? formatWhen(state.nextRunAt, state.timezone) ?? 'Scheduling...'
                    : 'Paused'}
                </span>
              </p>
              <p className="text-muted-foreground">
                Last run:{' '}
                <span className="text-foreground font-medium">
                  {formatWhen(state.lastRunAt, state.timezone) ?? 'Never'}
                </span>
                {state.lastStatus ? ` (${STATUS_LABELS[state.lastStatus] ?? state.lastStatus})` : ''}
              </p>
              {(state.lastStatus === 'failed' || state.lastStatus === 'blocked') && state.lastError && (
                <p
                  className={`flex items-start gap-2 ${
                    state.lastStatus === 'blocked' ? 'text-amber-500' : 'text-destructive'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{state.lastError}</span>
                </p>
              )}
              {state.lastStatus === 'success_last_scan' && state.lastError && (
                <p className="flex items-start gap-2 text-amber-500">
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
