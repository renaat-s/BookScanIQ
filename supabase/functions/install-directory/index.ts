import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already installed
    const { data: profile } = await supabase
      .from("profiles")
      .select("directory_installed")
      .eq("user_id", user.id)
      .single();

    if (profile?.directory_installed) {
      return new Response(JSON.stringify({ success: true, message: "Already installed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call n8n webhook
    const webhookUrl = Deno.env.get("N8N_INSTALL_DIRECTORY_WEBHOOK_URL");
    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "Webhook URL not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsedWebhookUrl: URL;
    try {
      parsedWebhookUrl = new URL(webhookUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Install directory webhook URL is invalid" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const blockedHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
    if (blockedHosts.has(parsedWebhookUrl.hostname)) {
      return new Response(JSON.stringify({
        error: "Install directory webhook must be a public URL, not localhost",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const n8nSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
    if (!n8nSecret) {
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookResponse = await fetch(parsedWebhookUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-workflow-secret": n8nSecret,
      },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
      }),
    });

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text();
      console.error(`n8n webhook failed [${webhookResponse.status}]: ${errorBody}`);
      return new Response(JSON.stringify({ error: "Failed to install directory" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as installed
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ directory_installed: true })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update profile:", updateError.message);
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in install-directory:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
