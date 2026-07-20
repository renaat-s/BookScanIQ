// Sheet reader edge function — reads the user's InvoiceIQ ledger spreadsheet
// using their google_refresh_token, and returns sheet metadata + values for a tab.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeadersFor } from "../_shared/cors.ts";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function exchangeRefreshToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth client credentials not configured");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Google token exchange failed: ${data.error_description || data.error || res.status}`,
    );
  }
  return data.access_token as string;
}

Deno.serve(async (req) => {
  
  const corsHeaders = corsHeadersFor(req);
if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: creds } = await admin
      .from("user_credentials")
      .select("google_refresh_token, user_spreadsheet_id")
      .eq("user_id", user.id)
      .single();

    if (!creds?.google_refresh_token) {
      return json({ error: "Google not connected" }, 400);
    }
    if (!creds?.user_spreadsheet_id) {
      return json({ error: "No ledger spreadsheet linked" }, 400);
    }

    const body = await req.json().catch(() => ({}));
    const sheetName: string | undefined = body.sheetName;

    const accessToken = await exchangeRefreshToken(creds.google_refresh_token);
    const headers = { Authorization: `Bearer ${accessToken}` };

    const metaUrl = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(creds.user_spreadsheet_id)}`,
    );
    metaUrl.searchParams.set(
      "fields",
      "spreadsheetId,properties.title,spreadsheetUrl,sheets.properties(sheetId,title,index,gridProperties)",
    );

    const metaRes = await fetch(metaUrl, { headers });
    if (!metaRes.ok) {
      const t = await metaRes.text();
      return json({ error: `Sheets metadata error: ${t}` }, 502);
    }
    const meta = await metaRes.json();

    const tabs = (meta.sheets ?? []).map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
      rowCount: s.properties?.gridProperties?.rowCount ?? 0,
      columnCount: s.properties?.gridProperties?.columnCount ?? 0,
    }));

    const requested = (sheetName || "").trim().toLowerCase();
    const activeTab =
      (requested
        ? tabs.find((t: any) => t.title === sheetName) ||
          tabs.find((t: any) => (t.title || "").trim().toLowerCase() === requested) ||
          tabs.find((t: any) => (t.title || "").trim().toLowerCase().includes(requested))
        : null) || tabs[0];
    if (!activeTab) {
      return json({
        spreadsheet: {
          id: meta.spreadsheetId,
          title: meta.properties?.title,
          url: meta.spreadsheetUrl,
        },
        tabs: [],
        active: null,
        values: [],
      });
    }

    const range = `'${activeTab.title.replace(/'/g, "''")}'!A1:ZZ10000`;
    const valuesUrl = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(creds.user_spreadsheet_id)}/values/${range}`,
    );
    valuesUrl.searchParams.set("valueRenderOption", "FORMATTED_VALUE");
    valuesUrl.searchParams.set("dateTimeRenderOption", "FORMATTED_STRING");

    const valRes = await fetch(valuesUrl, { headers });
    if (!valRes.ok) {
      const t = await valRes.text();
      return json({ error: `Sheets values error: ${t}` }, 502);
    }
    const valData = await valRes.json();

    return json({
      spreadsheet: {
        id: meta.spreadsheetId,
        title: meta.properties?.title,
        url: meta.spreadsheetUrl,
      },
      tabs,
      active: activeTab,
      values: valData.values ?? [],
    });
  } catch (e) {
    console.error("sheet-read error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
