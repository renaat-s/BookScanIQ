// Xero OAuth callback — exchanges authorization code for tokens,
// fetches the tenant/organization IDs from Xero's Connections endpoint,
// and persists everything to user_credentials for the calling user.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  code?: string;
  redirect_uri?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const XERO_CLIENT_ID = Deno.env.get("XERO_CLIENT_ID")!;
    const XERO_CLIENT_SECRET = Deno.env.get("XERO_CLIENT_SECRET")!;

    // Identify the caller using their JWT
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Invalid user session" }, 401);
    }
    const userId = userData.user.id;

    const body: Body = await req.json().catch(() => ({}));
    const code = body.code?.trim();
    const redirectUri = body.redirect_uri?.trim();
    if (!code || !redirectUri) {
      return json({ error: "Missing code or redirect_uri" }, 400);
    }

    // 1) Exchange the authorization code for tokens
    const basicAuth = btoa(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`);
    const tokenRes = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Xero token exchange failed:", tokenJson);
      return json(
        { error: "Token exchange failed", detail: tokenJson },
        400,
      );
    }
    const accessToken: string = tokenJson.access_token;
    const refreshToken: string = tokenJson.refresh_token;

    // 2) Fetch the connected tenants
    const connRes = await fetch("https://api.xero.com/connections", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const connections = await connRes.json();
    if (!connRes.ok || !Array.isArray(connections) || connections.length === 0) {
      console.error("Xero connections fetch failed:", connections);
      return json({ error: "No Xero connections found" }, 400);
    }
    // Pick the first tenant (most users only have one)
    const tenantId: string = connections[0].tenantId;
    const organizationId: string =
      connections[0].id ?? connections[0].organizationId ?? null;

    // 3) Persist to user_credentials (atomic merge — never overwrite google token)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: updateErr } = await adminClient
      .from("user_credentials")
      .update({
        xero_tenant_id: tenantId,
        xero_organization_id: organizationId,
        xero_refresh_token: refreshToken,
      })
      .eq("user_id", userId);

    if (updateErr) {
      console.error("Xero credentials update failed:", updateErr);
      return json({ error: "Failed to save Xero credentials" }, 500);
    }

    return json({
      success: true,
      tenant_id: tenantId,
      organization_id: organizationId,
      tenant_name: connections[0].tenantName ?? null,
    });
  } catch (err) {
    console.error("xero-oauth-callback error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
