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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if credentials are already fully populated — skip if so
    const { data: creds } = await supabase
      .from("user_credentials")
      .select("folder_mapping, user_spreadsheet_id, root_folder_id")
      .eq("user_id", user.id)
      .single();

    if (creds?.folder_mapping && creds?.user_spreadsheet_id && creds?.root_folder_id) {
      // Also ensure profile flag is synced
      await supabase
        .from("profiles")
        .update({ directory_installed: true })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true, message: "Already installed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call n8n webhook (synchronous — waits for Respond to Webhook node)
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

    console.log(`Calling n8n install-directory for user ${user.id}`);

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

    // Parse the synchronous response from n8n's Respond to Webhook node
    let n8nData: any;
    const responseText = await webhookResponse.text();
    try {
      n8nData = JSON.parse(responseText);
    } catch {
      console.log("n8n returned non-JSON response, treating as success signal:", responseText);
      // n8n responded OK but without structured data — fall back to polling
      return new Response(JSON.stringify({ success: true, mode: "polling" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { root_folder_id, folder_mapping, user_spreadsheet_id } = n8nData;

    // If n8n returned the IDs, write them directly to user_credentials
    if (root_folder_id && folder_mapping && user_spreadsheet_id) {
      console.log("n8n returned credentials, writing to user_credentials");

      const { error: updateError } = await supabase
        .from("user_credentials")
        .update({
          root_folder_id,
          folder_mapping,
          user_spreadsheet_id,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update user_credentials:", updateError.message);
        return new Response(JSON.stringify({ error: "Failed to save directory credentials" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark profile as installed
      await supabase
        .from("profiles")
        .update({ directory_installed: true })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({
        success: true,
        mode: "direct",
        root_folder_id,
        user_spreadsheet_id,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // n8n responded with JSON but without the required fields — fall back to polling
    console.log("n8n response missing credential fields, falling back to polling");
    return new Response(JSON.stringify({ success: true, mode: "polling" }), {
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
