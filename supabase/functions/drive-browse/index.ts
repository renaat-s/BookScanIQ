// Drive browser edge function — lists folder contents using the user's google_refresh_token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeadersFor } from "../_shared/cors.ts";

// Per-request CORS headers; assigned at the top of each request handler.
let corsHeaders: Record<string, string> = {};
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
  
  corsHeaders = corsHeadersFor(req);
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
      .select("google_refresh_token, root_folder_id")
      .eq("user_id", user.id)
      .single();

    if (!creds?.google_refresh_token) {
      return json({ error: "Google not connected" }, 400);
    }

    const body = await req.json().catch(() => ({}));
    const folderId: string = body.folderId || creds.root_folder_id;
    const pageToken: string | undefined = body.pageToken;
    if (!folderId) return json({ error: "No folder id" }, 400);

    const accessToken = await exchangeRefreshToken(creds.google_refresh_token);

    // Folder metadata (for breadcrumb name + parents)
    const metaUrl = new URL(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}`,
    );
    metaUrl.searchParams.set("fields", "id,name,mimeType,parents,webViewLink");
    metaUrl.searchParams.set("supportsAllDrives", "true");

    // List children
    const listUrl = new URL("https://www.googleapis.com/drive/v3/files");
    listUrl.searchParams.set(
      "q",
      `'${folderId}' in parents and trashed = false`,
    );
    listUrl.searchParams.set(
      "fields",
      "nextPageToken,files(id,name,mimeType,modifiedTime,size,iconLink,webViewLink,thumbnailLink)",
    );
    listUrl.searchParams.set("orderBy", "folder,name");
    listUrl.searchParams.set("pageSize", "200");
    listUrl.searchParams.set("supportsAllDrives", "true");
    listUrl.searchParams.set("includeItemsFromAllDrives", "true");
    if (pageToken) listUrl.searchParams.set("pageToken", pageToken);

    const headers = { Authorization: `Bearer ${accessToken}` };
    const [metaRes, listRes] = await Promise.all([
      fetch(metaUrl, { headers }),
      fetch(listUrl, { headers }),
    ]);

    if (!metaRes.ok) {
      const t = await metaRes.text();
      return json({ error: `Drive metadata error: ${t}` }, 502);
    }
    if (!listRes.ok) {
      const t = await listRes.text();
      return json({ error: `Drive list error: ${t}` }, 502);
    }

    const meta = await metaRes.json();
    const list = await listRes.json();

    return json({
      folder: {
        id: meta.id,
        name: meta.name,
        parents: meta.parents ?? [],
        webViewLink: meta.webViewLink,
      },
      files: list.files ?? [],
      nextPageToken: list.nextPageToken ?? null,
      rootFolderId: creds.root_folder_id,
    });
  } catch (e) {
    console.error("drive-browse error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
