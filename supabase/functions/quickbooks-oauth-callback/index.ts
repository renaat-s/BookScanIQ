// QuickBooks OAuth callback — exchanges authorization code for tokens,
// captures the realmId from the callback, and persists the refresh
// token + realm ID to user_credentials for the calling user.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  code?: string;
  realm_id?: string;
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
    const QB_CLIENT_ID = Deno.env.get("QUICKBOOKS_CLIENT_ID")!;
    const QB_CLIENT_SECRET = Deno.env.get("QUICKBOOKS_CLIENT_SECRET")!;

    // Identify the caller
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
    const realmId = body.realm_id?.trim();
    const redirectUri = body.redirect_uri?.trim();
    if (!code || !realmId || !redirectUri) {
      return json(
        { error: "Missing code, realm_id, or redirect_uri" },
        400,
      );
    }

    // 1) Exchange the authorization code for tokens
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
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      },
    );
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("QuickBooks token exchange failed:", tokenJson);
      return json(
        { error: "Token exchange failed", detail: tokenJson },
        400,
      );
    }
    const refreshToken: string = tokenJson.refresh_token;
    if (!refreshToken) {
      return json({ error: "No refresh_token returned by Intuit" }, 400);
    }

    // 2) Persist to user_credentials (atomic merge)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: updated, error: updateErr } = await adminClient
      .from("user_credentials")
      .update({
        qb_realm_id: realmId,
        quickbooks_refresh_token: refreshToken,
      })
      .eq("user_id", userId)
      .select("user_id");

    if (updateErr) {
      console.error("QuickBooks credentials update failed:", updateErr);
      return json({ error: "Failed to save QuickBooks credentials" }, 500);
    }
    if (!updated || updated.length === 0) {
      console.error("No user_credentials row exists for user:", userId);
      return json(
        {
          error:
            "No credentials profile found. Please connect your Google account first before linking QuickBooks.",
        },
        409,
      );
    }

    return json({ success: true, realm_id: realmId });
  } catch (err) {
    console.error("quickbooks-oauth-callback error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
