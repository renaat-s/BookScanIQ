import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
];


function isValidFileSignature(bytes: Uint8Array, mimeType: string): boolean {
  // PDF check
  if (mimeType === 'application/pdf') {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }
  
  // JPEG check
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  }
  
  // PNG check
  if (mimeType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  }
  
  // WEBP check (RIFF....WEBP)
  if (mimeType === 'image/webp') {
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  }
  
  // HEIC/HEIF - check for ftyp box
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    // ftyp box typically at offset 4
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    return ftyp === 'ftyp';
  }
  
  return false;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client and verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} uploading file invoice`);

    // Get webhook URL and secret
    const webhookUrl = Deno.env.get('N8N_FILE_INVOICE_WEBHOOK_URL');
    if (!webhookUrl) {
      console.error('N8N_FILE_INVOICE_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const n8nSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    if (!n8nSecret) {
      console.error('N8N_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const filename = formData.get('filename') as string || file?.name || 'invoice';
    const timestamp = formData.get('timestamp') as string || new Date().toISOString();

    if (!file) {
      console.error('No file provided in request');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${file.size} bytes`);
      return new Response(
        JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return new Response(
        JSON.stringify({ error: `Invalid file type. Allowed: PDF, HEIC, JPEG, PNG, WEBP` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file signature (magic bytes)
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    if (!isValidFileSignature(bytes, file.type)) {
      console.error('File signature does not match declared MIME type');
      return new Response(
        JSON.stringify({ error: 'File content does not match file type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(filename);
    console.log(`Processing file: ${sanitizedFilename}, type: ${file.type}, size: ${file.size}`);

    // Recreate file from buffer and prepare FormData for n8n
    const newFile = new File([bytes], sanitizedFilename, { type: file.type });
    const n8nFormData = new FormData();
    n8nFormData.append('file', newFile);
    n8nFormData.append('filename', sanitizedFilename);
    n8nFormData.append('timestamp', timestamp);
    n8nFormData.append('user_id', user.id);
    n8nFormData.append('user_email', user.email || '');
    n8nFormData.append('file_type', file.type);
    n8nFormData.append('file_size', file.size.toString());

    // Forward to n8n webhook with auth
    console.log('Forwarding to n8n webhook...');
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'x-workflow-secret': n8nSecret,
      },
      body: n8nFormData,
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`n8n webhook error: ${n8nResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to process file', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle n8n response - may be JSON or plain text
    let n8nResult: unknown = null;
    const responseText = await n8nResponse.text();
    console.log('n8n response status:', n8nResponse.status);

    try {
      n8nResult = JSON.parse(responseText);
    } catch {
      // n8n returned non-JSON (e.g. plain "OK") — that's fine, upload was accepted
      n8nResult = { raw: responseText };
    }

    console.log('Invoice filed successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invoice filed successfully',
        data: n8nResult 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing file invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
