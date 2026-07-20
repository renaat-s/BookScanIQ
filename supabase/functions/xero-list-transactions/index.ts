// Lists recent Xero invoices for the authenticated user.
// Uses the stored xero_refresh_token to mint a fresh access token,
// then queries /api.xro/2.0/Invoices for the most recent records.
import { createClient } from "npm:@supabase/supabase-js@2";

import { corsHeadersFor } from "../_shared/cors.ts";
const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  
  const corsHeaders = corsHeadersFor(req);
if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const XERO_CLIENT_ID = Deno.env.get("XERO_CLIENT_ID")!;
    const XERO_CLIENT_SECRET = Deno.env.get("XERO_CLIENT_SECRET")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: creds } = await admin
      .from("user_credentials")
      .select("xero_refresh_token, xero_tenant_id")
      .eq("user_id", userId)
      .single();

    if (!creds?.xero_refresh_token || !creds?.xero_tenant_id) {
      return json({ connected: false, transactions: [] });
    }

    // Refresh access token
    const basic = btoa(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`);
    const tokenRes = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: creds.xero_refresh_token,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Xero refresh failed:", tokenJson);
      return json({ connected: false, error: "Token refresh failed", transactions: [] }, 200);
    }

    const accessToken = tokenJson.access_token as string;
    const newRefresh = tokenJson.refresh_token as string;
    // Persist rotated refresh token
    if (newRefresh && newRefresh !== creds.xero_refresh_token) {
      await admin
        .from("user_credentials")
        .update({ xero_refresh_token: newRefresh })
        .eq("user_id", userId);
    }

    // Fetch most recent invoices (page 1, sorted by date desc)
    const url = "https://api.xero.com/api.xro/2.0/Invoices?order=Date%20DESC&page=1";
    const invRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Xero-Tenant-Id": creds.xero_tenant_id,
        Accept: "application/json",
      },
    });
    const invJson = await invRes.json();
    if (!invRes.ok) {
      console.error("Xero invoices fetch failed:", invJson);
      return json({ connected: true, error: "Fetch failed", transactions: [] }, 200);
    }

    const transactions = (invJson.Invoices || []).slice(0, 50).map((inv: any) => ({
      id: inv.InvoiceID,
      number: inv.InvoiceNumber,
      contact: inv.Contact?.Name ?? null,
      date: inv.DateString ?? inv.Date,
      due_date: inv.DueDateString ?? inv.DueDate,
      status: inv.Status,
      type: inv.Type, // ACCREC = income, ACCPAY = expense
      total: inv.Total,
      amount_due: inv.AmountDue,
      currency: inv.CurrencyCode,
    }));

    return json({ connected: true, transactions });
  } catch (err) {
    console.error("xero-list-transactions error:", err);
    return json({ error: (err as Error).message, transactions: [] }, 500);
  }
});
