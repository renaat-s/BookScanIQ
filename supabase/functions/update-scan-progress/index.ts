import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProgressUpdate {
  jobId: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  totalEmails?: number;
  processedEmails?: number;
  invoicesFound?: number;
  errorMessage?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { jobId, status, totalEmails, processedEmails, invoicesFound, errorMessage } = await req.json() as ProgressUpdate;

    if (!jobId) {
      console.error('Missing required jobId field');
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating scan job progress:', { jobId, status, totalEmails, processedEmails, invoicesFound });

    const updateData: Record<string, unknown> = {};
    
    if (status !== undefined) updateData.status = status;
    if (totalEmails !== undefined) updateData.total_emails = totalEmails;
    if (processedEmails !== undefined) updateData.processed_emails = processedEmails;
    if (invoicesFound !== undefined) updateData.invoices_found = invoicesFound;
    if (errorMessage !== undefined) updateData.error_message = errorMessage;
    
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseClient
      .from('scan_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update scan job:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update scan job', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scan job updated successfully:', data);

    return new Response(
      JSON.stringify({ success: true, job: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-scan-progress:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
