import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  scanType: 'forward' | 'backfill';
  backlogWeeks?: 4 | 8 | 12;
  jobId?: string;
  userId?: string;
  scanFromDate?: string; // DD/MM/YYYY
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { email, scanType = 'forward', backlogWeeks, jobId, userId: requestUserId } = await req.json() as RequestBody;

    if (!email) {
      console.error('Missing required email field');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestId = crypto.randomUUID();

    console.log('Connecting email to n8n webhook:', {
      requestId,
      email,
      userId: user.id,
      scanType,
      backlogWeeks,
      jobId,
    });

    // Select webhook URL based on scan type
    const webhookUrl = scanType === 'backfill' 
      ? Deno.env.get('N8N_BACKFILL_WEBHOOK_URL')
      : Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error(`${scanType === 'backfill' ? 'N8N_BACKFILL_WEBHOOK_URL' : 'N8N_WEBHOOK_URL'} not configured`);
      return new Response(
        JSON.stringify({ error: 'Email detector service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate webhook secret
    const n8nSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    if (!n8nSecret) {
      console.error('N8N_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send the email connection request to n8n
    // Add a short timeout so the UI doesn't hang indefinitely.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workflow-secret': n8nSecret,
      },
      body: JSON.stringify({
        requestId,
        action: scanType === 'backfill' ? 'start_backfill' : 'connect_email',
        email,
        userId: user.id,
        scanType,
        jobId,
        ...(backlogWeeks && { backlogWeeks }),
        timestamp: new Date().toISOString(),
        progressWebhookUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/update-scan-progress`,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const contentType = n8nResponse.headers.get('content-type') ?? '';
    const responseText = await n8nResponse.text();
    const bodyPreview = responseText.slice(0, 500);

    console.log('n8n response summary:', {
      scanType,
      status: n8nResponse.status,
      contentType,
      bodyPreview,
      // Do NOT log the URL/path (it may contain secrets). Hostname is safe.
      host: (() => {
        try {
          return new URL(webhookUrl).hostname;
        } catch {
          return 'invalid-url';
        }
      })(),
    });

    // If we got HTML back, it's almost certainly not the intended webhook endpoint.
    const looksLikeHtml = contentType.includes('text/html') || /^\s*</.test(responseText);

    if (!n8nResponse.ok || looksLikeHtml) {
      console.error('n8n webhook failed:', {
        status: n8nResponse.status,
        contentType,
        bodyPreview,
        looksLikeHtml,
      });

      return new Response(
        JSON.stringify({
          error: 'Failed to connect to email detector service',
          requestId,
          debug: {
            status: n8nResponse.status,
            contentType,
            bodyPreview,
            looksLikeHtml,
          },
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully initiated ${scanType} scan for email`);

    // Parse n8n's synchronous response to extract scan metrics
    let emailsProcessed = 0;
    let invoicesFound = 0;
    let scanCompleted = false;

    try {
      const n8nData = JSON.parse(responseText);
      // n8n returns an array of email items, each with id/threadId/subject/etc.
      if (Array.isArray(n8nData)) {
        emailsProcessed = n8nData.length;
        invoicesFound = n8nData.length; // Each returned item is a detected invoice email
        scanCompleted = true;
        console.log(`n8n returned ${emailsProcessed} items for ${scanType} scan`);
      } else if (typeof n8nData === 'object' && n8nData !== null) {
        // Handle wrapped response e.g. { items: [...] } or { count: N }
        if (Array.isArray(n8nData.items)) {
          emailsProcessed = n8nData.items.length;
          invoicesFound = n8nData.items.length;
          scanCompleted = true;
        } else if (typeof n8nData.count === 'number') {
          emailsProcessed = n8nData.count;
          invoicesFound = n8nData.count;
          scanCompleted = true;
        }
        console.log(`n8n returned object response, parsed ${emailsProcessed} items`);
      }
    } catch {
      console.log('n8n response was not valid JSON, skipping metric extraction');
    }

    // If we got metrics, write them directly to the scan_jobs table
    if (scanCompleted && jobId) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { error: updateError } = await supabaseAdmin
        .from('scan_jobs')
        .update({
          status: 'completed',
          total_emails: emailsProcessed,
          processed_emails: emailsProcessed,
          invoices_found: invoicesFound,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        console.error('Failed to update scan_jobs with n8n results:', updateError.message);
      } else {
        console.log(`Updated scan_jobs ${jobId}: ${emailsProcessed} emails, ${invoicesFound} invoices`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
        message: `${scanType} scan initiated successfully`,
        emailsProcessed,
        invoicesFound,
        scanCompleted,
        debug: {
          status: n8nResponse.status,
          contentType,
          bodyPreview,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in connect-email-detector:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
