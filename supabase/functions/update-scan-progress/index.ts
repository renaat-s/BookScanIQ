import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getScanAllowance } from "../_shared/scan-allowance.ts";


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

    // Store invoice data if provided, deducting from the monthly allowance as
    // documents are processed. If the allowance runs out mid-scan we insert
    // only what fits, then report completed vs blocked back to n8n.
    let limitReached = false;
    let acceptedCount = 0;
    let blockedCount = 0;
    let allowanceSnapshot: Record<string, unknown> | null = null;

    if (invoices && invoices.length > 0 && jobData) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('user_id', jobData.user_id)
        .maybeSingle();

      const allowance = await getScanAllowance(
        supabaseClient,
        jobData.user_id,
        profile?.email ?? jobData.email,
      );
      allowanceSnapshot = {
        tier: allowance.tier,
        cap: allowance.cap,
        used: allowance.used,
        remaining: allowance.remaining,
      };

      const capacity = allowance.remaining === null ? invoices.length : allowance.remaining;
      const accepted = invoices.slice(0, Math.max(0, capacity));
      acceptedCount = accepted.length;
      blockedCount = invoices.length - acceptedCount;
      limitReached = allowance.remaining !== null && blockedCount > 0;

      const invoiceRows = accepted.map((inv) => ({
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

      if (invoiceRows.length > 0) {
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

      if (limitReached) {
        const message =
          `Monthly scan allowance reached. ${acceptedCount} document${acceptedCount === 1 ? '' : 's'} ` +
          `filed, ${blockedCount} blocked. Your allowance resets at the start of next month.`;
        console.log(`Allowance limit hit on job ${jobId}: ${message}`);

        await supabaseClient
          .from('scan_jobs')
          .update({
            status: 'completed',
            error_message: message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        await supabaseClient.from('audit_events').insert({
          user_id: jobData.user_id,
          scan_job_id: jobId,
          event_type: 'scan_limit_reached',
          message: 'Scan stopped: monthly allowance reached',
          reasoning: message,
          metadata: { ...allowanceSnapshot, filed: acceptedCount, blocked: blockedCount },
        });
      }
    }


    console.log('Scan job updated successfully:', jobData);

    return new Response(
      JSON.stringify({
        success: true,
        job: jobData,
        // Guardrail signals for n8n: stop sending documents when limitReached.
        limitReached,
        filed: acceptedCount,
        blocked: blockedCount,
        allowance: allowanceSnapshot,
      }),
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
