// QuickBooks Chart of Accounts loader.
// Uses the user's stored quickbooks_refresh_token + qb_realm_id to:
//   1. Mint a fresh access_token from Intuit (refresh_token grant).
//   2. Query the user's Chart of Accounts.
//   3. Return [{ id, name, accountType, classification }] for the UI.
//
// We deliberately do NOT persist the new refresh_token rotation here unless
// Intuit returns a new one, in which case we update user_credentials so the
// next call still works.
import { createClient } from "npm:@supabase/supabase-js@2";

import { corsHeadersFor } from "../_shared/cors.ts";
interface QbAccount {
  Id: string;
  Name: string;
  AccountType?: string;
  AccountSubType?: string;
  Classification?: string;
  Active?: boolean;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);


    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const QB_CLIENT_ID = Deno.env.get("QUICKBOOKS_CLIENT_ID")!;
    const QB_CLIENT_SECRET = Deno.env.get("QUICKBOOKS_CLIENT_SECRET")!;
    const QB_ENV = (Deno.env.get("QUICKBOOKS_ENVIRONMENT") ?? "production")
      .toLowerCase();

    // Identify caller
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Invalid user session" }, 401);
    }
    const userId = userData.user.id;

    // Load credentials
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: creds, error: credsErr } = await adminClient
      .from("user_credentials")
      .select("quickbooks_refresh_token, qb_realm_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (credsErr) {
      console.error("Load credentials failed:", credsErr);
      return json({ error: "Failed to load credentials" }, 500);
    }
    if (!creds?.quickbooks_refresh_token || !creds.qb_realm_id) {
      return json({ error: "QuickBooks is not connected" }, 409);
    }

    // 1) Refresh the access token
    const basicAuth = btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`);
    const tokenRes = await fetch(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: creds.quickbooks_refresh_token,
        }),
      },
    );
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("QB token refresh failed:", tokenJson);
      return json(
        { error: "Failed to refresh QuickBooks access token", detail: tokenJson },
        400,
      );
    }
    const accessToken: string = tokenJson.access_token;
    const newRefreshToken: string | undefined = tokenJson.refresh_token;

    // Persist rotated refresh token (Intuit rotates ~every 100 days)
    if (newRefreshToken && newRefreshToken !== creds.quickbooks_refresh_token) {
      await adminClient
        .from("user_credentials")
        .update({ quickbooks_refresh_token: newRefreshToken })
        .eq("user_id", userId);
    }

    // 2) Query Chart of Accounts
    const apiBase = QB_ENV === "sandbox"
      ? "https://sandbox-quickbooks.api.intuit.com"
      : "https://quickbooks.api.intuit.com";

    const query = "select * from Account maxresults 1000";
    const url = `${apiBase}/v3/company/${
      encodeURIComponent(creds.qb_realm_id)
    }/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const apiRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const apiJson = await apiRes.json();
    if (!apiRes.ok) {
      console.error("QB accounts query failed:", apiJson);
      return json(
        { error: "Failed to load Chart of Accounts", detail: apiJson },
        apiRes.status,
      );
    }

    const raw: QbAccount[] = apiJson?.QueryResponse?.Account ?? [];
    const accounts = raw
      .filter((a) => a.Active !== false)
      .map((a) => ({
        id: a.Id,
        name: a.Name,
        accountType: a.AccountType ?? "",
        accountSubType: a.AccountSubType ?? "",
        classification: a.Classification ?? "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return json({ accounts });
  } catch (err) {
    console.error("quickbooks-list-accounts error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
