import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getScanAllowance } from "../_shared/scan-allowance.ts";


/**
 * Cron-invoked scheduler for recurring auto-scans.
 * Runs hourly, picks up every enabled schedule whose next_run_at has passed,
 * creates a scan_job and fires the n8n backfill webhook for it.
 *
 * Protected by a shared secret header (x-cron-secret) since it is invoked
 * from pg_cron/pg_net rather than from an authenticated browser session.
 */

interface ScheduleRow {
  id: string;
  user_id: string;
  frequency: "daily" | "weekly";
  day_of_week: number;
  hour_utc: number;
  lookback_weeks: number;
  timezone: string;
}

/** Next UTC run time strictly after `from`. */
function computeNextRun(
  frequency: "daily" | "weekly",
  dayOfWeek: number,
  hourUtc: number,
  from: Date,
): Date {
  const next = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), hourUtc, 0, 0, 0),
  );
  if (frequency === "daily") {
    while (next <= from) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }
  while (next <= from || next.getUTCDay() !== dayOfWeek) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

const pad = (n: number) => String(n).padStart(2, "0");
const formatDDMMYYYY = (d: Date) =>
  `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const workflowSecret = Deno.env.get("N8N_WEBHOOK_SECRET") ?? "";
  const provided = req.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    console.error("run-scheduled-scans: unauthorized invocation");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const webhookUrl = Deno.env.get("N8N_BACKFILL_WEBHOOK_URL");
  if (!webhookUrl) {
    console.error("N8N_BACKFILL_WEBHOOK_URL not configured");
    return new Response(JSON.stringify({ error: "Scanner not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date();

  const { data: due, error: dueError } = await supabase
    .from("scan_schedules")
    .select("id, user_id, frequency, day_of_week, hour_utc, lookback_weeks, timezone")
    .eq("enabled", true)
    .lte("next_run_at", now.toISOString())
    .limit(200);

  if (dueError) {
    console.error("Failed to load due schedules:", dueError.message);
    return new Response(JSON.stringify({ error: "Query failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const schedules = (due ?? []) as ScheduleRow[];
  console.log(`run-scheduled-scans: ${schedules.length} schedule(s) due`);

  let triggered = 0;
  let blocked = 0;

  for (const s of schedules) {
    // Claim the slot immediately so a slow webhook can't cause a double-run.
    const nextRun = computeNextRun(s.frequency, s.day_of_week, s.hour_utc, now);
    await supabase
      .from("scan_schedules")
      .update({ last_run_at: now.toISOString(), next_run_at: nextRun.toISOString(), last_status: "running", last_error: null })
      .eq("id", s.id);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", s.user_id)
        .maybeSingle();

      const email = profile?.email;
      if (!email) throw new Error("No email on file for this user");

      // ---- Feature A guardrail: scan-and-deduct against the monthly allowance ----
      const allowance = await getScanAllowance(supabase, s.user_id, email);

      if (allowance.remaining !== null && allowance.remaining <= 0) {
        const message =
          `Monthly scan allowance reached (${allowance.used}/${allowance.cap} documents). ` +
          `This scheduled scan was skipped. Your allowance resets at the start of next month.`;
        console.log(`Skipping scheduled scan for ${s.user_id}: allowance exhausted`);

        await supabase
          .from("scan_schedules")
          .update({ last_status: "blocked", last_error: message })
          .eq("id", s.id);

        await supabase.from("audit_events").insert({
          user_id: s.user_id,
          event_type: "scan_blocked",
          message: "Scheduled scan skipped: monthly allowance reached",
          reasoning: message,
          metadata: { cap: allowance.cap, used: allowance.used, tier: allowance.tier },
        });

        blocked++;
        continue;
      }

      const { data: job, error: jobError } = await supabase
        .from("scan_jobs")
        .insert({
          user_id: s.user_id,
          email,
          scan_type: "backfill",
          status: "pending",
        })
        .select("id")
        .single();

      if (jobError) throw jobError;

      const from = new Date(now.getTime() - s.lookback_weeks * 7 * 24 * 60 * 60 * 1000);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workflow-secret": workflowSecret,
        },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          action: "start_backfill",
          email,
          userId: s.user_id,
          scanType: "backfill",
          jobId: job.id,
          backlogWeeks: s.lookback_weeks,
          // Hard stop for n8n: process at most this many documents in this run.
          // null = unlimited (Enterprise / developer).
          documentLimit: allowance.remaining,
          allowance: {
            tier: allowance.tier,
            cap: allowance.cap,
            used: allowance.used,
            remaining: allowance.remaining,
            lastOne: allowance.lastOne,
          },
          schedule: {
            frequency: s.frequency,
            dayOfWeekUtc: s.day_of_week,
            hourUtc: s.hour_utc,
            timezone: s.timezone ?? "UTC",
            backlogWeeks: s.lookback_weeks,
          },
          scanFromDate: formatDDMMYYYY(from),
          trigger: "scheduled",
          timestamp: now.toISOString(),
          progressWebhookUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/update-scan-progress`,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) throw new Error(`n8n responded ${res.status}`);

      await supabase
        .from("scan_schedules")
        .update({
          last_status: allowance.lastOne ? "success_last_scan" : "success",
          last_error: allowance.lastOne
            ? `Heads up: this run uses the last document on your ${allowance.tier ?? "current"} plan (${allowance.cap}/month).`
            : null,
        })
        .eq("id", s.id);

      await supabase.from("scan_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", job.id);

      triggered++;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Scheduled scan failed for user ${s.user_id}:`, message);
      await supabase
        .from("scan_schedules")
        .update({ last_status: "failed", last_error: message })
        .eq("id", s.id);
    }
  }

  return new Response(JSON.stringify({ success: true, due: schedules.length, triggered, blocked }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
