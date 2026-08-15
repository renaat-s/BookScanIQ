import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const refreshToken = Deno.env.get("QUICKBOOKS_REFRESH_TOKEN");

  if (!authHeader || !url || !anonKey || !serviceKey || !refreshToken) {
    return json({ error: "Required credentials are unavailable" }, 500);
  }

  const admin = createClient(url, serviceKey);

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  let targetUserId: string | null = null;

  if (token === serviceKey) {
    // Service-role call: resolve the developer account directly.
    const { data: authUsers } = await admin.auth.admin.listUsers();
    targetUserId =
      authUsers?.users?.find(
        (u) => u.email?.toLowerCase() === "renaat.sibanda23@gmail.com",
      )?.id ?? null;
    if (!targetUserId) return json({ error: "Developer account not found" }, 404);
  } else {
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || userData.user?.email?.toLowerCase() !== "renaat.sibanda23@gmail.com") {
      return json({ error: "Not authorized" }, 403);
    }
    targetUserId = userData.user.id;
  }

  const { data, error } = await admin
    .from("user_credentials")
    .update({ quickbooks_refresh_token: refreshToken })
    .eq("user_id", targetUserId)
    .select("user_id, qb_realm_id")
    .maybeSingle();

  if (error) return json({ error: "Unable to update QuickBooks credentials" }, 500);
  if (!data) return json({ error: "QuickBooks credentials record not found" }, 404);

  return json({ success: true, realm_id_preserved: Boolean(data.qb_realm_id) });
});