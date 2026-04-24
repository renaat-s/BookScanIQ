import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp", "image/gif"];

// Magic bytes for image file detection
const IMAGE_SIGNATURES: { [key: string]: number[] } = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header for WebP
};

function isValidImageSignature(bytes: Uint8Array): boolean {
  for (const [, signature] of Object.entries(IMAGE_SIGNATURES)) {
    if (signature.every((byte, i) => bytes[i] === byte)) {
      return true;
    }
  }
  // HEIC/HEIF files have 'ftyp' at offset 4
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return true;
  }
  return false;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

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

    // Server-side file size validation
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size);
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side MIME type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return new Response(
        JSON.stringify({ error: "Invalid file type. Only images are allowed (JPEG, PNG, HEIC, HEIF, WebP, GIF)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify magic bytes to ensure file content matches MIME type
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer).slice(0, 12);
    
    if (!isValidImageSignature(bytes)) {
      console.error("File content does not match image signature");
      return new Response(
        JSON.stringify({ error: "Invalid file content. File does not appear to be a valid image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = sanitizeFilename(filename || file.name);

    console.log("Uploading receipt:", { 
      filename: sanitizedFilename, 
      timestamp, 
      fileSize: file.size, 
      fileType: file.type,
      userId: user.id 
    });

    // Forward the file to n8n webhook - recreate the file from buffer
    const n8nFormData = new FormData();
    const newFile = new File([buffer], sanitizedFilename, { type: file.type });
    n8nFormData.append("file", newFile, sanitizedFilename);
    n8nFormData.append("filename", sanitizedFilename);
    n8nFormData.append("timestamp", timestamp);
    n8nFormData.append("userId", user.id);

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
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
