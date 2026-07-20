// Returns public OAuth client IDs so the frontend can construct
// authorize URLs without hardcoding them. These IDs are NOT secret —
// they appear in the user's browser URL bar during OAuth.
import { corsHeadersFor } from "../_shared/cors.ts";
Deno.serve((req: Request) => {
  
  const corsHeaders = corsHeadersFor(req);
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
