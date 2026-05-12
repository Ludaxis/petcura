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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_outputs: {
        Row: {
          accepted: boolean | null
          clinic_id: string
          confidence: number | null
          created_at: string
          edited_output_json: Json | null
          id: string
          input_json: Json
          kind: string
          latency_ms: number | null
          model: string
          output_json: Json
          prompt_version: string
          request_id: string | null
          reviewed_by: string | null
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          accepted?: boolean | null
          clinic_id: string
          confidence?: number | null
          created_at?: string
          edited_output_json?: Json | null
          id?: string
          input_json: Json
          kind: string
          latency_ms?: number | null
          model: string
          output_json: Json
          prompt_version: string
          request_id?: string | null
          reviewed_by?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          accepted?: boolean | null
          clinic_id?: string
          confidence?: number | null
          created_at?: string
          edited_output_json?: Json | null
          id?: string
          input_json?: Json
          kind?: string
          latency_ms?: number | null
          model?: string
          output_json?: Json
          prompt_version?: string
          request_id?: string | null
          reviewed_by?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_outputs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_outputs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          message_id: string | null
          mime_type: string
          request_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          message_id?: string | null
          mime_type: string
          request_id: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          message_id?: string | null
          mime_type?: string
          request_id?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          clinic_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip: unknown
          payload_json: Json
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          clinic_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip?: unknown
          payload_json?: Json
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          clinic_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip?: unknown
          payload_json?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_channels: {
        Row: {
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          created_at: string
          display_name: string | null
          external_id: string
          id: string
          is_active: boolean
          settings_json: Json
        }
        Insert: {
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          created_at?: string
          display_name?: string | null
          external_id: string
          id?: string
          is_active?: boolean
          settings_json?: Json
        }
        Update: {
          channel?: Database["public"]["Enums"]["owner_channel"]
          clinic_id?: string
          created_at?: string
          display_name?: string | null
          external_id?: string
          id?: string
          is_active?: boolean
          settings_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "clinic_channels_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_staff: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean
          permissions: Json
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json
          role?: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          branding_json: Json
          country: string
          created_at: string
          id: string
          locale: string
          name: string
          settings: Json
          slug: string
          timezone: string
        }
        Insert: {
          branding_json?: Json
          country?: string
          created_at?: string
          id?: string
          locale?: string
          name: string
          settings?: Json
          slug: string
          timezone?: string
        }
        Update: {
          branding_json?: Json
          country?: string
          created_at?: string
          id?: string
          locale?: string
          name?: string
          settings?: Json
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      internal_notes: {
        Row: {
          author_id: string | null
          body: string
          clinic_id: string
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          clinic_id: string
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          clinic_id?: string
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      message_delivery_events: {
        Row: {
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          created_at: string
          external_event_id: string | null
          id: string
          message_id: string
          payload_json: Json
          provider: string | null
          status: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          created_at?: string
          external_event_id?: string | null
          id?: string
          message_id: string
          payload_json?: Json
          provider?: string | null
          status: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["owner_channel"]
          clinic_id?: string
          created_at?: string
          external_event_id?: string | null
          id?: string
          message_id?: string
          payload_json?: Json
          provider?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_delivery_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_delivery_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_translations: {
        Row: {
          ai_output_id: string | null
          clinic_id: string
          created_at: string
          id: string
          message_id: string
          model: string
          prompt_version: string
          source_locale: string
          target_locale: string
          translated_body: string
        }
        Insert: {
          ai_output_id?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          message_id: string
          model: string
          prompt_version: string
          source_locale: string
          target_locale: string
          translated_body: string
        }
        Update: {
          ai_output_id?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          message_id?: string
          model?: string
          prompt_version?: string
          source_locale?: string
          target_locale?: string
          translated_body?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_translations_ai_output_id_fkey"
            columns: ["ai_output_id"]
            isOneToOne: false
            referencedRelation: "ai_outputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_translations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_translations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          body_translated: string | null
          clinic_id: string
          created_at: string
          external_id: string | null
          id: string
          request_id: string
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          source_locale: string | null
        }
        Insert: {
          body: string
          body_translated?: string | null
          clinic_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          request_id: string
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          source_locale?: string | null
        }
        Update: {
          body?: string
          body_translated?: string | null
          clinic_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          request_id?: string
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          source_locale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_channel_identities: {
        Row: {
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          consented_at: string | null
          created_at: string
          external_id: string
          id: string
          is_primary: boolean
          opted_out_at: string | null
          owner_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          consented_at?: string | null
          created_at?: string
          external_id: string
          id?: string
          is_primary?: boolean
          opted_out_at?: string | null
          owner_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["owner_channel"]
          clinic_id?: string
          consented_at?: string | null
          created_at?: string
          external_id?: string
          id?: string
          is_primary?: boolean
          opted_out_at?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_channel_identities_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_channel_identities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          clinic_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          gdpr_consent_at: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string
          preferred_language: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          gdpr_consent_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone: string
          preferred_language?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          gdpr_consent_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string
          preferred_language?: string
        }
        Relationships: [
          {
            foreignKeyName: "owners_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          allergies: string | null
          birth_date: string | null
          breed: string | null
          clinic_id: string
          created_at: string
          deleted_at: string | null
          id: string
          medical_notes: string | null
          name: string
          owner_id: string
          photo_url: string | null
          sex: string | null
          species: string
          weight_kg: number | null
        }
        Insert: {
          allergies?: string | null
          birth_date?: string | null
          breed?: string | null
          clinic_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          medical_notes?: string | null
          name: string
          owner_id: string
          photo_url?: string | null
          sex?: string | null
          species: string
          weight_kg?: number | null
        }
        Update: {
          allergies?: string | null
          birth_date?: string | null
          breed?: string | null
          clinic_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          medical_notes?: string | null
          name?: string
          owner_id?: string
          photo_url?: string | null
          sex?: string | null
          species?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          acknowledged_at: string | null
          body: string | null
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_at: string
          id: string
          last_delivery_message_id: string | null
          last_send_attempt_at: string | null
          last_send_error: string | null
          pet_id: string | null
          request_id: string | null
          send_attempts: number
          sent_at: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          acknowledged_at?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at: string
          id?: string
          last_delivery_message_id?: string | null
          last_send_attempt_at?: string | null
          last_send_error?: string | null
          pet_id?: string | null
          request_id?: string | null
          send_attempts?: number
          sent_at?: string | null
          status?: string
          title: string
          type: string
        }
        Update: {
          acknowledged_at?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["owner_channel"]
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string
          id?: string
          last_delivery_message_id?: string | null
          last_send_attempt_at?: string | null
          last_send_error?: string | null
          pet_id?: string | null
          request_id?: string | null
          send_attempts?: number
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_last_delivery_message_id_fkey"
            columns: ["last_delivery_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          clinic_id: string
          created_at: string
          event_type: string
          id: string
          payload_json: Json
          request_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          clinic_id: string
          created_at?: string
          event_type: string
          id?: string
          payload_json?: Json
          request_id: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          clinic_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload_json?: Json
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          ai_summary: string | null
          ai_summary_translations_json: Json
          ai_summary_version: string | null
          assigned_staff_id: string | null
          category: Database["public"]["Enums"]["request_category"]
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          created_at: string
          id: string
          owner_id: string
          pet_id: string | null
          resolved_at: string | null
          risk_flags_json: Json
          sla_due_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          urgency: Database["public"]["Enums"]["request_urgency"]
          urgency_suggestion:
            | Database["public"]["Enums"]["request_urgency"]
            | null
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_translations_json?: Json
          ai_summary_version?: string | null
          assigned_staff_id?: string | null
          category: Database["public"]["Enums"]["request_category"]
          channel?: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          created_at?: string
          id?: string
          owner_id: string
          pet_id?: string | null
          resolved_at?: string | null
          risk_flags_json?: Json
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["request_urgency"]
          urgency_suggestion?:
            | Database["public"]["Enums"]["request_urgency"]
            | null
        }
        Update: {
          ai_summary?: string | null
          ai_summary_translations_json?: Json
          ai_summary_version?: string | null
          assigned_staff_id?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          channel?: Database["public"]["Enums"]["owner_channel"]
          clinic_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          pet_id?: string | null
          resolved_at?: string | null
          risk_flags_json?: Json
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["request_urgency"]
          urgency_suggestion?:
            | Database["public"]["Enums"]["request_urgency"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "clinic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_clinic_id: { Args: never; Returns: string }
    }
    Enums: {
      message_sender_type: "owner" | "staff" | "system" | "ai"
      owner_channel: "whatsapp" | "sms" | "web"
      request_category:
        | "medical_question"
        | "refill"
        | "appointment"
        | "follow_up"
        | "admin"
      request_status: "new" | "waiting_staff" | "waiting_owner" | "resolved"
      request_urgency: "low" | "medium" | "high"
      staff_role: "owner" | "admin" | "vet" | "tech" | "reception" | "viewer"
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
    Enums: {
      message_sender_type: ["owner", "staff", "system", "ai"],
      owner_channel: ["whatsapp", "sms", "web"],
      request_category: [
        "medical_question",
        "refill",
        "appointment",
        "follow_up",
        "admin",
      ],
      request_status: ["new", "waiting_staff", "waiting_owner", "resolved"],
      request_urgency: ["low", "medium", "high"],
      staff_role: ["owner", "admin", "vet", "tech", "reception", "viewer"],
    },
  },
} as const
