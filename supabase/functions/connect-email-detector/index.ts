const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  userId: string;
  scanType: 'forward' | 'backfill';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, scanType = 'forward' } = await req.json() as RequestBody;

    if (!email || !userId) {
      console.error('Missing required fields:', { email: !!email, userId: !!userId });
      return new Response(
        JSON.stringify({ error: 'Email and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Connecting email to n8n webhook:', { email, userId, scanType });

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
        userId,
        scanType,
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
