// Returns public OAuth client IDs so the frontend can construct
// authorize URLs without hardcoding them. These IDs are NOT secret —
// they appear in the user's browser URL bar during OAuth.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const payload = {
    xero_client_id: Deno.env.get("XERO_CLIENT_ID") ?? null,
    quickbooks_client_id: Deno.env.get("QUICKBOOKS_CLIENT_ID") ?? null,
    quickbooks_environment:
      Deno.env.get("QUICKBOOKS_ENVIRONMENT") ?? "production",
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
