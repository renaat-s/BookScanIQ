import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const N8N_WEBHOOK_URL = Deno.env.get("N8N_UPLOAD_RECEIPT_WEBHOOK_URL");
    
    if (!N8N_WEBHOOK_URL) {
      console.error("N8N_UPLOAD_RECEIPT_WEBHOOK_URL is not configured");
      return new Response(
        JSON.stringify({ error: "Upload webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;
    const timestamp = formData.get("timestamp") as string;

    if (!file) {
      console.error("No file provided in request");
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Uploading receipt:", { filename, timestamp, fileSize: file.size });

    // Forward the file to n8n webhook
    const n8nFormData = new FormData();
    n8nFormData.append("file", file, filename);
    n8nFormData.append("filename", filename);
    n8nFormData.append("timestamp", timestamp);

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      body: n8nFormData,
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("n8n webhook error:", webhookResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process receipt", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookData = await webhookResponse.json().catch(() => ({}));
    console.log("n8n webhook response:", webhookData);

    return new Response(
      JSON.stringify(webhookData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in upload-receipt function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
