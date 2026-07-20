// Lists recent QuickBooks invoices for the authenticated user.
// Uses the stored quickbooks_refresh_token to mint a fresh access token,
// then queries the QBO Query API for the most recent invoices.
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
    const QB_CLIENT_ID = Deno.env.get("QUICKBOOKS_CLIENT_ID")!;
    const QB_CLIENT_SECRET = Deno.env.get("QUICKBOOKS_CLIENT_SECRET")!;
    const QB_ENV = (Deno.env.get("QUICKBOOKS_ENVIRONMENT") ?? "production").toLowerCase();

    const apiBase =
      QB_ENV === "sandbox"
        ? "https://sandbox-quickbooks.api.intuit.com"
        : "https://quickbooks.api.intuit.com";

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: creds } = await admin
      .from("user_credentials")
      .select("quickbooks_refresh_token, qb_realm_id")
      .eq("user_id", userId)
      .single();

    if (!creds?.quickbooks_refresh_token || !creds?.qb_realm_id) {
      return json({ connected: false, transactions: [] });
    }

    // Refresh access token
    const basic = btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`);
    const tokenRes = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: creds.quickbooks_refresh_token,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("QB refresh failed:", tokenJson);
      return json({ connected: false, error: "Token refresh failed", transactions: [] }, 200);
    }
    const accessToken = tokenJson.access_token as string;
    const newRefresh = tokenJson.refresh_token as string;
    if (newRefresh && newRefresh !== creds.quickbooks_refresh_token) {
      await admin
        .from("user_credentials")
        .update({ quickbooks_refresh_token: newRefresh })
        .eq("user_id", userId);
    }

    const query = encodeURIComponent(
      "SELECT Id, DocNumber, TxnDate, DueDate, TotalAmt, Balance, CustomerRef, CurrencyRef FROM Invoice ORDERBY TxnDate DESC MAXRESULTS 50"
    );
    const url = `${apiBase}/v3/company/${creds.qb_realm_id}/query?query=${query}&minorversion=70`;
    const invRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const invJson = await invRes.json();
    if (!invRes.ok) {
      console.error("QB invoices fetch failed:", invJson);
      return json({ connected: true, error: "Fetch failed", transactions: [] }, 200);
    }

    const rows = invJson?.QueryResponse?.Invoice ?? [];
    const transactions = rows.map((inv: any) => ({
      id: inv.Id,
      number: inv.DocNumber,
      contact: inv.CustomerRef?.name ?? null,
      date: inv.TxnDate,
      due_date: inv.DueDate,
      total: inv.TotalAmt,
      balance: inv.Balance,
      currency: inv.CurrencyRef?.value ?? null,
      status: (inv.Balance ?? 0) === 0 ? "Paid" : "Open",
      type: "Income",
    }));

    return json({ connected: true, transactions });
  } catch (err) {
    console.error("quickbooks-list-transactions error:", err);
    return json({ error: (err as Error).message, transactions: [] }, 500);
  }
});
