import { supabase } from "@/integrations/supabase/client";

export type AuditEventType =
  | "scan_started"
  | "scan_completed"
  | "scan_failed"
  | "invoice_detected"
  | "invoice_categorized"
  | "invoice_synced_xero"
  | "invoice_synced_quickbooks"
  | "invoice_synced_sheets"
  | "workspace_connected"
  | "workspace_disconnected"
  | "settings_updated"
  | "data_exported";

interface LogParams {
  userId: string;
  eventType: AuditEventType;
  message: string;
  reasoning?: string;
  invoiceId?: string;
  scanJobId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records a tamper-evident audit event for the current user.
 * Fails silently — auditing must never break the user-facing flow.
 */
export async function logAuditEvent(params: LogParams): Promise<void> {
  try {
    await supabase.from("audit_events").insert({
      user_id: params.userId,
      event_type: params.eventType,
      message: params.message,
      reasoning: params.reasoning ?? null,
      invoice_id: params.invoiceId ?? null,
      scan_job_id: params.scanJobId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.warn("[auditLog] failed to record event", err);
  }
}
