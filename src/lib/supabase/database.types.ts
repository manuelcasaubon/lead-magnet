// Generado desde Supabase (proyecto qzfzswascgitycynwlkk). Regenerar con el MCP de Supabase:
// generate_typescript_types, después de cada migración.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          user_id?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string
          id: number
          payload: Json
          resend_id: string | null
          svix_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: never
          payload: Json
          resend_id?: string | null
          svix_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: never
          payload?: Json
          resend_id?: string | null
          svix_id?: string | null
          type?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          clicked_at: string | null
          created_at: string
          error: string | null
          id: string
          opened_at: string | null
          person_id: string | null
          resend_id: string | null
          sent_at: string | null
          status: string
          template_id: string
          template_version: number
          to_email: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          opened_at?: string | null
          person_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          template_id: string
          template_version: number
          to_email: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          opened_at?: string | null
          person_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string
          template_version?: number
          to_email?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audience: string
          body: string
          created_at: string
          id: string
          key: string
          kind: string
          objection: string | null
          preheader: string | null
          send_at: string | null
          status: string
          subject: string
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audience: string
          body: string
          created_at?: string
          id?: string
          key: string
          kind: string
          objection?: string | null
          preheader?: string | null
          send_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audience?: string
          body?: string
          created_at?: string
          id?: string
          key?: string
          kind?: string
          objection?: string | null
          preheader?: string | null
          send_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          experiments: Json
          id: number
          name: string
          path: string | null
          person_id: string | null
          props: Json
          session_id: string | null
          source: string | null
          utm: Json | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          experiments?: Json
          id?: never
          name: string
          path?: string | null
          person_id?: string | null
          props?: Json
          session_id?: string | null
          source?: string | null
          utm?: Json | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          experiments?: Json
          id?: never
          name?: string
          path?: string | null
          person_id?: string | null
          props?: Json
          session_id?: string | null
          source?: string | null
          utm?: Json | null
          visitor_id?: string
        }
        Relationships: []
      }
      experiment_assignments: {
        Row: {
          assigned_at: string
          experiment_id: string
          variant_key: string
          visitor_id: string
        }
        Insert: {
          assigned_at?: string
          experiment_id: string
          variant_key: string
          visitor_id: string
        }
        Update: {
          assigned_at?: string
          experiment_id?: string
          variant_key?: string
          visitor_id?: string
        }
        Relationships: []
      }
      experiment_variants: {
        Row: {
          config: Json
          experiment_id: string
          id: string
          key: string
          name: string
          weight: number
        }
        Insert: {
          config?: Json
          experiment_id: string
          id?: string
          key: string
          name: string
          weight?: number
        }
        Update: {
          config?: Json
          experiment_id?: string
          id?: string
          key?: string
          name?: string
          weight?: number
        }
        Relationships: []
      }
      experiments: {
        Row: {
          created_at: string
          hypothesis: string | null
          id: string
          key: string
          min_sample_per_variant: number
          name: string
          primary_metric: string
          started_at: string | null
          status: string
          stopped_at: string | null
          surface: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hypothesis?: string | null
          id?: string
          key: string
          min_sample_per_variant?: number
          name: string
          primary_metric?: string
          started_at?: string | null
          status?: string
          stopped_at?: string | null
          surface: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hypothesis?: string | null
          id?: string
          key?: string
          min_sample_per_variant?: number
          name?: string
          primary_metric?: string
          started_at?: string | null
          status?: string
          stopped_at?: string | null
          surface?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_touches: {
        Row: {
          created_at: string
          experiments: Json
          id: number
          path: string | null
          person_id: string
          referrer: string | null
          source: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          experiments?: Json
          id?: never
          path?: string | null
          person_id: string
          referrer?: string | null
          source: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          experiments?: Json
          id?: never
          path?: string | null
          person_id?: string
          referrer?: string | null
          source?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      mp_notifications: {
        Row: {
          error: string | null
          id: number
          processed_at: string | null
          received_at: string
          request_id: string | null
          resource_id: string | null
          result: string | null
          signature_ok: boolean
          topic: string | null
        }
        Insert: {
          error?: string | null
          id?: never
          processed_at?: string | null
          received_at?: string
          request_id?: string | null
          resource_id?: string | null
          result?: string | null
          signature_ok: boolean
          topic?: string | null
        }
        Update: {
          error?: string | null
          id?: never
          processed_at?: string | null
          received_at?: string
          request_id?: string | null
          resource_id?: string | null
          result?: string | null
          signature_ok?: boolean
          topic?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_ars: number
          approved_at: string | null
          created_at: string
          experiments: Json
          hold_expires_at: string | null
          id: string
          mp_payment_id: number | null
          mp_preference_id: string | null
          person_id: string
          source: string | null
          status: string
          updated_at: string
          utm: Json | null
          visitor_id: string | null
        }
        Insert: {
          amount_ars: number
          approved_at?: string | null
          created_at?: string
          experiments?: Json
          hold_expires_at?: string | null
          id?: string
          mp_payment_id?: number | null
          mp_preference_id?: string | null
          person_id: string
          source?: string | null
          status?: string
          updated_at?: string
          utm?: Json | null
          visitor_id?: string | null
        }
        Update: {
          amount_ars?: number
          approved_at?: string | null
          created_at?: string
          experiments?: Json
          hold_expires_at?: string | null
          id?: string
          mp_payment_id?: number | null
          mp_preference_id?: string | null
          person_id?: string
          source?: string | null
          status?: string
          updated_at?: string
          utm?: Json | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          date_approved: string | null
          fee_amount: number | null
          mp_payment_id: number
          net_received_amount: number | null
          order_id: string | null
          payer_email: string | null
          payment_method: string | null
          raw: Json
          status: string
          status_detail: string | null
          transaction_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_approved?: string | null
          fee_amount?: number | null
          mp_payment_id: number
          net_received_amount?: number | null
          order_id?: string | null
          payer_email?: string | null
          payment_method?: string | null
          raw: Json
          status: string
          status_detail?: string | null
          transaction_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_approved?: string | null
          fee_amount?: number | null
          mp_payment_id?: number
          net_received_amount?: number | null
          order_id?: string | null
          payer_email?: string | null
          payment_method?: string | null
          raw?: Json
          status?: string
          status_detail?: string | null
          transaction_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          brand_url: string | null
          consent_at: string | null
          consent_text: string | null
          created_at: string
          email: string
          email_status: string
          first_source: string | null
          first_utm: Json | null
          first_visitor_id: string | null
          goal: string | null
          id: string
          instagram: string | null
          marketing_consent: boolean
          name: string | null
          notes: string | null
          phone: string | null
          status: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          brand_url?: string | null
          consent_at?: string | null
          consent_text?: string | null
          created_at?: string
          email: string
          email_status?: string
          first_source?: string | null
          first_utm?: Json | null
          first_visitor_id?: string | null
          goal?: string | null
          id?: string
          instagram?: string | null
          marketing_consent?: boolean
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          brand_url?: string | null
          consent_at?: string | null
          consent_text?: string | null
          created_at?: string
          email?: string
          email_status?: string
          first_source?: string | null
          first_utm?: Json | null
          first_visitor_id?: string | null
          goal?: string | null
          id?: string
          instagram?: string | null
          marketing_consent?: boolean
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          site_url: string
          email_from: string
          email_reply_to: string | null
          email_mode: string
          email_test_recipients: string[]
          manu_notify_email: string | null
          link_valid_from: string
          absorb_fee: boolean
          mp_link_match: string | null
          capacity_max: number
          capacity_public: number
          doors_label: string
          event_ends_at: string
          event_name: string
          event_starts_at: string
          event_tagline: string
          hold_minutes: number
          id: number
          price_ars: number | null
          price_usd: number
          sales_open: boolean
          updated_at: string
          venue: string
        }
        Insert: {
          site_url?: string
          email_from?: string
          email_reply_to?: string | null
          email_mode?: string
          email_test_recipients?: string[]
          manu_notify_email?: string | null
          link_valid_from?: string
          absorb_fee?: boolean
          mp_link_match?: string | null
          capacity_max?: number
          capacity_public?: number
          doors_label?: string
          event_ends_at?: string
          event_name?: string
          event_starts_at?: string
          event_tagline?: string
          hold_minutes?: number
          id?: number
          price_ars?: number | null
          price_usd?: number
          sales_open?: boolean
          updated_at?: string
          venue?: string
        }
        Update: {
          site_url?: string
          email_from?: string
          email_reply_to?: string | null
          email_mode?: string
          email_test_recipients?: string[]
          manu_notify_email?: string | null
          link_valid_from?: string
          absorb_fee?: boolean
          mp_link_match?: string | null
          capacity_max?: number
          capacity_public?: number
          doors_label?: string
          event_ends_at?: string
          event_name?: string
          event_starts_at?: string
          event_tagline?: string
          hold_minutes?: number
          id?: number
          price_ars?: number | null
          price_usd?: number
          sales_open?: boolean
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          audit_notes: string | null
          audit_profile: string | null
          checked_in_at: string | null
          code: string
          created_at: string
          id: string
          manu_notified_at: string | null
          order_id: string
          overbooked: boolean
          person_id: string
          status: string
          updated_at: string
        }
        Insert: {
          audit_notes?: string | null
          audit_profile?: string | null
          checked_in_at?: string | null
          code: string
          created_at?: string
          id?: string
          manu_notified_at?: string | null
          order_id: string
          overbooked?: boolean
          person_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          audit_notes?: string | null
          audit_profile?: string | null
          checked_in_at?: string | null
          code?: string
          created_at?: string
          id?: string
          manu_notified_at?: string | null
          order_id?: string
          overbooked?: boolean
          person_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          device: string | null
          first_path: string | null
          first_referrer: string | null
          first_seen_at: string
          first_utm: Json | null
          id: string
          last_seen_at: string
          person_id: string | null
        }
        Insert: {
          device?: string | null
          first_path?: string | null
          first_referrer?: string | null
          first_seen_at?: string
          first_utm?: Json | null
          id: string
          last_seen_at?: string
          person_id?: string | null
        }
        Update: {
          device?: string | null
          first_path?: string | null
          first_referrer?: string | null
          first_seen_at?: string
          first_utm?: Json | null
          id?: string
          last_seen_at?: string
          person_id?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      adopt_link_payment: {
        Args: { p_payment: Json }
        Returns: { adopted: boolean; newly_approved: boolean; order_id: string | null; order_status: string | null; overbooked: boolean; ticket_code: string | null }[]
      }
      apply_payment: {
        Args: { p_payment: Json }
        Returns: { newly_approved: boolean; order_id: string; order_status: string; overbooked: boolean; ticket_code: string }[]
      }
      expire_holds: { Args: never; Returns: number }
      reserve_order: {
        Args: { p_experiments?: Json; p_person_id: string; p_source?: string; p_utm?: Json; p_visitor_id?: string }
        Returns: Database["public"]["Tables"]["orders"]["Row"]
      }
      seats_status: {
        Args: never
        Returns: { capacity_max: number; capacity_public: number; holds: number; left_max: number; left_public: number; price_ars: number | null; sales_open: boolean; sold: number }[]
      }
      set_order_preference: { Args: { p_order_id: string; p_preference_id: string }; Returns: undefined }
      touch_visitor: {
        Args: { p_id: string; p_referrer: string; p_path: string; p_utm: Json; p_device: string }
        Returns: undefined
      }
      unsubscribe: { Args: { p_token: string }; Returns: boolean }
      upsert_lead: {
        Args: {
          p_brand_url?: string; p_consent?: boolean; p_consent_text?: string; p_email: string
          p_experiments?: Json; p_goal?: string; p_instagram?: string; p_name?: string; p_path?: string
          p_phone?: string; p_referrer?: string; p_source?: string; p_utm?: Json; p_visitor_id?: string
        }
        Returns: { is_new: boolean; person_id: string; status: string }[]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
