export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_dismissals: {
        Row: {
          alert_key: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          alert_key: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          alert_key?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          invoice_id: string | null
          message: string
          metadata: Json | null
          reasoning: string | null
          scan_job_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          invoice_id?: string | null
          message: string
          metadata?: Json | null
          reasoning?: string | null
          scan_job_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          invoice_id?: string | null
          message?: string
          metadata?: Json | null
          reasoning?: string | null
          scan_job_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_scan_job_id_fkey"
            columns: ["scan_job_id"]
            isOneToOne: false
            referencedRelation: "scan_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          prompt: string | null
          route: string | null
          sentiment: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          prompt?: string | null
          route?: string | null
          sentiment?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          prompt?: string | null
          route?: string | null
          sentiment?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          file_id: string | null
          id: string
          invoice_category: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_total: string | null
          invoice_type: string | null
          invoice_vendor: string | null
          month_folder: string | null
          scan_job_id: string | null
          user_id: string
          web_view_link: string | null
          year: string | null
        }
        Insert: {
          created_at?: string
          file_id?: string | null
          id?: string
          invoice_category?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_total?: string | null
          invoice_type?: string | null
          invoice_vendor?: string | null
          month_folder?: string | null
          scan_job_id?: string | null
          user_id: string
          web_view_link?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string
          file_id?: string | null
          id?: string
          invoice_category?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_total?: string | null
          invoice_type?: string | null
          invoice_vendor?: string | null
          month_folder?: string | null
          scan_job_id?: string | null
          user_id?: string
          web_view_link?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_scan_job_id_fkey"
            columns: ["scan_job_id"]
            isOneToOne: false
            referencedRelation: "scan_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          currency: string | null
          document_type: string | null
          drive_file_id: string | null
          entry_date: string | null
          exchange_rate: number | null
          exported_at: string | null
          id: string
          last_seen_at: string
          month: string
          original_type: string | null
          review_note: string | null
          review_status: string
          reviewed_at: string | null
          sheet_row_hash: string
          source: string
          type: string
          updated_at: string
          user_id: string
          vendor: string | null
          verified_present: boolean
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string | null
          document_type?: string | null
          drive_file_id?: string | null
          entry_date?: string | null
          exchange_rate?: number | null
          exported_at?: string | null
          id?: string
          last_seen_at?: string
          month: string
          original_type?: string | null
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          sheet_row_hash: string
          source?: string
          type: string
          updated_at?: string
          user_id: string
          vendor?: string | null
          verified_present?: boolean
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string | null
          document_type?: string | null
          drive_file_id?: string | null
          entry_date?: string | null
          exchange_rate?: number | null
          exported_at?: string | null
          id?: string
          last_seen_at?: string
          month?: string
          original_type?: string | null
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          sheet_row_hash?: string
          source?: string
          type?: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
          verified_present?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          directory_installed: boolean
          email: string | null
          export_dry_run: boolean
          full_name: string | null
          id: string
          low_cognitive_mode: boolean
          minutes_per_doc: number
          n8n_webhook_connected: boolean | null
          review_queue_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          directory_installed?: boolean
          email?: string | null
          export_dry_run?: boolean
          full_name?: string | null
          id?: string
          low_cognitive_mode?: boolean
          minutes_per_doc?: number
          n8n_webhook_connected?: boolean | null
          review_queue_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          directory_installed?: boolean
          email?: string | null
          export_dry_run?: boolean
          full_name?: string | null
          id?: string
          low_cognitive_mode?: boolean
          minutes_per_doc?: number
          n8n_webhook_connected?: boolean | null
          review_queue_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          email: string
          error_message: string | null
          id: string
          invoices_found: number | null
          processed_emails: number | null
          scan_type: string
          started_at: string | null
          status: string
          total_emails: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          invoices_found?: number | null
          processed_emails?: number | null
          scan_type: string
          started_at?: string | null
          status?: string
          total_emails?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          invoices_found?: number | null
          processed_emails?: number | null
          scan_type?: string
          started_at?: string | null
          status?: string
          total_emails?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          enabled: boolean
          frequency: string
          hour_utc: number
          id: string
          last_error: string | null
          last_run_at: string | null
          last_status: string | null
          lookback_weeks: number
          next_run_at: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number
          enabled?: boolean
          frequency?: string
          hour_utc?: number
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          lookback_weeks?: number
          next_run_at?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          enabled?: boolean
          frequency?: string
          hour_utc?: number
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          lookback_weeks?: number
          next_run_at?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credentials: {
        Row: {
          created_at: string
          default_currency: string
          email: string | null
          folder_mapping: Json | null
          google_refresh_token: string | null
          id: string
          last_ledger_sync_at: string | null
          qb_environment: string
          qb_home_currency: string
          qb_realm_id: string | null
          quickbooks_expense_account: string | null
          quickbooks_income_account: string | null
          quickbooks_refresh_token: string | null
          root_folder_id: string | null
          uncat_folder_id: string | null
          updated_at: string
          user_id: string
          user_spreadsheet_id: string | null
          xero_expense_account: string | null
          xero_income_account: string | null
          xero_organization_id: string | null
          xero_refresh_token: string | null
          xero_tenant_id: string | null
        }
        Insert: {
          created_at?: string
          default_currency?: string
          email?: string | null
          folder_mapping?: Json | null
          google_refresh_token?: string | null
          id?: string
          last_ledger_sync_at?: string | null
          qb_environment?: string
          qb_home_currency?: string
          qb_realm_id?: string | null
          quickbooks_expense_account?: string | null
          quickbooks_income_account?: string | null
          quickbooks_refresh_token?: string | null
          root_folder_id?: string | null
          uncat_folder_id?: string | null
          updated_at?: string
          user_id: string
          user_spreadsheet_id?: string | null
          xero_expense_account?: string | null
          xero_income_account?: string | null
          xero_organization_id?: string | null
          xero_refresh_token?: string | null
          xero_tenant_id?: string | null
        }
        Update: {
          created_at?: string
          default_currency?: string
          email?: string | null
          folder_mapping?: Json | null
          google_refresh_token?: string | null
          id?: string
          last_ledger_sync_at?: string | null
          qb_environment?: string
          qb_home_currency?: string
          qb_realm_id?: string | null
          quickbooks_expense_account?: string | null
          quickbooks_income_account?: string | null
          quickbooks_refresh_token?: string | null
          root_folder_id?: string | null
          uncat_folder_id?: string | null
          updated_at?: string
          user_id?: string
          user_spreadsheet_id?: string | null
          xero_expense_account?: string | null
          xero_income_account?: string | null
          xero_organization_id?: string | null
          xero_refresh_token?: string | null
          xero_tenant_id?: string | null
        }
        Relationships: []
      }
      vendor_logos: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string
          updated_at: string
          user_id: string
          vendor_key: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url: string
          updated_at?: string
          user_id: string
          vendor_key: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string
          updated_at?: string
          user_id?: string
          vendor_key?: string
          vendor_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
