import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceData {
  'Invoice Vendor'?: string;
  'Invoice Total'?: string;
  'Invoice Date'?: string;
  'Invoice Number'?: string;
  'Invoice Category'?: string;
  'Invoice Type'?: string;
  year?: string;
  monthFolder?: string;
  webViewLink?: string;
  fileId?: string;
}

interface ProgressUpdate {
  jobId: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  totalEmails?: number;
  processedEmails?: number;
  invoicesFound?: number;
  errorMessage?: string;
  invoices?: InvoiceData[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { jobId, status, totalEmails, processedEmails, invoicesFound, errorMessage, invoices } = await req.json() as ProgressUpdate;

    if (!jobId) {
      console.error('Missing required jobId field');
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating scan job progress:', { jobId, status, totalEmails, processedEmails, invoicesFound, invoiceCount: invoices?.length ?? 0 });

    // Update scan job
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (totalEmails !== undefined) updateData.total_emails = totalEmails;
    if (processedEmails !== undefined) updateData.processed_emails = processedEmails;
    if (invoicesFound !== undefined) updateData.invoices_found = invoicesFound;
    if (errorMessage !== undefined) updateData.error_message = errorMessage;
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: jobData, error: jobError } = await supabaseClient
      .from('scan_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (jobError) {
      console.error('Failed to update scan job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to update scan job', details: jobError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store invoice data if provided
    if (invoices && invoices.length > 0 && jobData) {
      const invoiceRows = invoices.map((inv) => ({
        user_id: jobData.user_id,
        scan_job_id: jobId,
        invoice_vendor: inv['Invoice Vendor'] ?? null,
        invoice_total: inv['Invoice Total'] ?? null,
        invoice_date: inv['Invoice Date'] ?? null,
        invoice_number: inv['Invoice Number'] ?? null,
        invoice_category: inv['Invoice Category'] ?? null,
        invoice_type: inv['Invoice Type'] ?? null,
        year: inv.year ?? null,
        month_folder: inv.monthFolder ?? null,
        web_view_link: inv.webViewLink ?? null,
        file_id: inv.fileId ?? null,
      }));

      const { error: insertError } = await supabaseClient
        .from('invoices')
        .insert(invoiceRows);

      if (insertError) {
        console.error('Failed to insert invoices:', insertError);
        // Don't fail the whole request - job was updated successfully
      } else {
        console.log(`Successfully stored ${invoiceRows.length} invoices for job ${jobId}`);
      }
    }

    console.log('Scan job updated successfully:', jobData);

    return new Response(
      JSON.stringify({ success: true, job: jobData }),
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
