// Deletes a file from the user's Google Drive using their refresh token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeadersFor } from "../_shared/cors.ts";
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function exchangeRefreshToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google OAuth client credentials not configured");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      refresh_token: refreshToken, grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Google token exchange failed: ${data.error_description || data.error || res.status}`);
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

    const { fileId } = await req.json().catch(() => ({}));
    if (!fileId) return json({ error: "Missing fileId" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: creds } = await admin
      .from("user_credentials")
      .select("google_refresh_token, root_folder_id")
      .eq("user_id", user.id)
      .single();

    if (!creds?.google_refresh_token) return json({ error: "Google not connected" }, 400);

    const accessToken = await exchangeRefreshToken(creds.google_refresh_token);

    // Verify the file is inside the user's InvoiceIQ directory tree before deleting.
    // Walk up parents until we hit the root_folder_id or run out.
    if (creds.root_folder_id) {
      let currentId = fileId;
      let allowed = false;
      for (let i = 0; i < 10; i++) {
        const metaRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(currentId)}?fields=id,parents&supportsAllDrives=true`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!metaRes.ok) break;
        const meta = await metaRes.json();
        const parents: string[] = meta.parents ?? [];
        if (parents.includes(creds.root_folder_id)) { allowed = true; break; }
        if (!parents.length) break;
        currentId = parents[0];
      }
      if (!allowed) return json({ error: "File is outside the InvoiceIQ directory" }, 403);
    }

    // Trash (safer than permanent delete — recoverable from Drive's bin).
    const delRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trashed: true }),
      },
    );
    if (!delRes.ok) {
      const t = await delRes.text();
      return json({ error: `Drive delete error: ${t}` }, 502);
    }

    return json({ success: true });
  } catch (e) {
    console.error("drive-delete error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
