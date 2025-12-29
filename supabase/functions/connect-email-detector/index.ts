import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  scanType: 'forward' | 'backfill';
  backlogWeeks?: 4 | 8 | 12;
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

    const { email, scanType = 'forward', backlogWeeks } = await req.json() as RequestBody;

    if (!email) {
      console.error('Missing required email field');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Connecting email to n8n webhook:', { email, userId: user.id, scanType, backlogWeeks });

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

    // Send the email connection request to n8n
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: scanType === 'backfill' ? 'start_backfill' : 'connect_email',
        email,
        userId: user.id,
        scanType,
        ...(backlogWeeks && { backlogWeeks }),
        timestamp: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      console.error('n8n webhook failed:', n8nResponse.status, await n8nResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to connect to email detector service' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully initiated ${scanType} scan for email`);

    return new Response(
      JSON.stringify({ success: true, message: `${scanType} scan initiated successfully` }),
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
