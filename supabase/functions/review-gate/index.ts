// n8n-facing endpoint that gates accounting exports on the user's review queue.
// Authenticated with the shared x-workflow-secret header (no user JWT).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeadersFor } from "../_shared/cors.ts";

const json = (b: unknown, headers: Record<string, string>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...headers, "Content-Type": "application/json" } });

// Warm-instance FX cache: "GBP>USD" -> { rate, ts }
const fxCache = new Map<string, { rate: number; ts: number }>();
const FX_TTL_MS = 60 * 60 * 1000;

async function getRate(from: string, to: string): Promise<number> {
  const key = `${from}>${to}`;
  const hit = fxCache.get(key);
  if (hit && Date.now() - hit.ts < FX_TTL_MS) return hit.rate;
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    const data = await res.json();
    const rate = Number(data?.rates?.[to]);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("bad rate");
    fxCache.set(key, { rate, ts: Date.now() });
    return rate;
  } catch (e) {
    console.error("FX lookup failed", key, e);
    return 1.0;
  }
}


Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const secret = Deno.env.get("N8N_WEBHOOK_SECRET");
    if (!secret || req.headers.get("x-workflow-secret") !== secret) {
      return json({ error: "Unauthorized" }, corsHeaders, 401);
    }

    const body = await req.json().catch(() => ({}));
    const userId: string | undefined = body.userId;
    const action: string = body.action ?? "check";
    if (!userId) return json({ error: "userId is required" }, corsHeaders, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("review_queue_enabled, export_dry_run")
      .eq("user_id", userId)
      .maybeSingle();
    const gateEnabled = Boolean(profile?.review_queue_enabled);
    // Global kill-switch wins; otherwise the per-user flag. Default false.
    const globalDryRun = (Deno.env.get("EXPORT_DRY_RUN") ?? "").toLowerCase() === "true";
    const dryRun = globalDryRun || Boolean((profile as { export_dry_run?: boolean } | null)?.export_dry_run);

    // 1) check: is a single document cleared for export?
    if (action === "check") {
      const driveFileId: string | undefined = body.driveFileId;
      if (!gateEnabled) return json({ gateEnabled: false, approved: true }, corsHeaders);
      if (!driveFileId) return json({ error: "driveFileId is required" }, corsHeaders, 400);

      const { data } = await admin
        .from("ledger_entries")
        .select("id, review_status, exported_at")
        .eq("user_id", userId)
        .eq("drive_file_id", driveFileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return json(
        {
          gateEnabled: true,
          found: Boolean(data),
          status: data?.review_status ?? "pending",
          approved: data?.review_status === "approved",
          alreadyExported: Boolean(data?.exported_at),
          entryId: data?.id ?? null,
        },
        corsHeaders,
      );
    }

    // 2) list: everything approved and not yet exported.
    if (action === "list-approved") {
      const { data } = await admin
        .from("ledger_entries")
        .select(
          "id, entry_date, month, type, amount, currency, exchange_rate, vendor, category, document_type, drive_file_id",
        )
        .eq("user_id", userId)
        .eq("review_status", "approved")
        .is("exported_at", null)
        .order("entry_date", { ascending: true })
        .limit(500);
      const qbEnvironment = (Deno.env.get("QUICKBOOKS_ENVIRONMENT") ?? "production").toLowerCase();
      const qbApiBaseUrl =
        qbEnvironment === "sandbox"
          ? "https://sandbox-quickbooks.api.intuit.com"
          : "https://quickbooks.api.intuit.com";

      // Fallback currency so n8n never receives a null/empty CurrencyRef.
      const { data: creds } = await admin
        .from("user_credentials")
        .select("default_currency, qb_home_currency")
        .eq("user_id", userId)
        .maybeSingle();
      const credRow = creds as { default_currency?: string | null; qb_home_currency?: string | null } | null;
      const defaultCurrency = (credRow?.default_currency || "GBP").toUpperCase();
      const homeCurrency = (credRow?.qb_home_currency || "USD").toUpperCase();

      const entries = await Promise.all(
        (data ?? []).map(async (e: Record<string, unknown>) => {
          const currency = ((e.currency as string | null) || defaultCurrency).toUpperCase();
          const exchange_rate = currency === homeCurrency ? null : await getRate(currency, homeCurrency);
          return { ...e, currency, exchange_rate };
        }),
      );

      return json(
        { dryRun, gateEnabled, qbEnvironment, qbApiBaseUrl, defaultCurrency, homeCurrency, entries },
        corsHeaders,
      );
    }

    // 3) mark-exported: n8n confirms the rows reached Xero / QuickBooks.
    if (action === "mark-exported") {
      const ids: string[] = Array.isArray(body.entryIds) ? body.entryIds : [];
      const driveFileIds: string[] = Array.isArray(body.driveFileIds) ? body.driveFileIds : [];
      if (ids.length === 0 && driveFileIds.length === 0) {
        return json({ error: "entryIds or driveFileIds is required" }, corsHeaders, 400);
      }
      const stamp = new Date().toISOString();
      let updated = 0;
      if (ids.length > 0) {
        const { data } = await admin
          .from("ledger_entries")
          .update({ exported_at: stamp })
          .eq("user_id", userId)
          .in("id", ids)
          .select("id");
        updated += data?.length ?? 0;
      }
      if (driveFileIds.length > 0) {
        const { data } = await admin
          .from("ledger_entries")
          .update({ exported_at: stamp })
          .eq("user_id", userId)
          .in("drive_file_id", driveFileIds)
          .select("id");
        updated += data?.length ?? 0;
      }
      return json({ updated }, corsHeaders);
    }

    return json({ error: `Unknown action: ${action}` }, corsHeaders, 400);
  } catch (e) {
    console.error("review-gate error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, corsHeaders, 500);
  }
});
