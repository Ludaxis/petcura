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
      ai_memory_items: {
        Row: {
          clinic_id: string
          confidence: number | null
          content_json: Json
          content_text: string
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          memory_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          scope_id: string
          scope_type: string
          source_ai_output_id: string | null
          source_locale: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          confidence?: number | null
          content_json?: Json
          content_text: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          memory_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_id: string
          scope_type: string
          source_ai_output_id?: string | null
          source_locale?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          confidence?: number | null
          content_json?: Json
          content_text?: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          memory_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_id?: string
          scope_type?: string
          source_ai_output_id?: string | null
          source_locale?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memory_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_memory_items_source_ai_output_id_fkey"
            columns: ["source_ai_output_id"]
            isOneToOne: false
            referencedRelation: "ai_outputs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memory_sources: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          memory_item_id: string
          source_id: string
          source_type: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          memory_item_id: string
          source_id: string
          source_type: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          memory_item_id?: string
          source_id?: string
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memory_sources_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_memory_sources_memory_item_id_fkey"
            columns: ["memory_item_id"]
            isOneToOne: false
            referencedRelation: "ai_memory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_output_sources: {
        Row: {
          ai_output_id: string
          clinic_id: string
          created_at: string
          id: string
          metadata_json: Json
          source_id: string
          source_label: string | null
          source_type: string
        }
        Insert: {
          ai_output_id: string
          clinic_id: string
          created_at?: string
          id?: string
          metadata_json?: Json
          source_id: string
          source_label?: string | null
          source_type: string
        }
        Update: {
          ai_output_id?: string
          clinic_id?: string
          created_at?: string
          id?: string
          metadata_json?: Json
          source_id?: string
          source_label?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_output_sources_ai_output_id_fkey"
            columns: ["ai_output_id"]
            isOneToOne: false
            referencedRelation: "ai_outputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_output_sources_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_outputs: {
        Row: {
          accepted: boolean | null
          blocked_reason: string | null
          clinic_id: string
          confidence: number | null
          created_at: string
          edited_output_json: Json | null
          failure_reason: string | null
          id: string
          input_json: Json
          kind: string
          latency_ms: number | null
          model: string
          output_json: Json
          prompt_hash: string | null
          prompt_key: string | null
          prompt_version: string
          provenance_json: Json
          provider: string | null
          raw_output_text: string | null
          request_id: string | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          accepted?: boolean | null
          blocked_reason?: string | null
          clinic_id: string
          confidence?: number | null
          created_at?: string
          edited_output_json?: Json | null
          failure_reason?: string | null
          id?: string
          input_json: Json
          kind: string
          latency_ms?: number | null
          model: string
          output_json: Json
          prompt_hash?: string | null
          prompt_key?: string | null
          prompt_version: string
          provenance_json?: Json
          provider?: string | null
          raw_output_text?: string | null
          request_id?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          accepted?: boolean | null
          blocked_reason?: string | null
          clinic_id?: string
          confidence?: number | null
          created_at?: string
          edited_output_json?: Json | null
          failure_reason?: string | null
          id?: string
          input_json?: Json
          kind?: string
          latency_ms?: number | null
          model?: string
          output_json?: Json
          prompt_hash?: string | null
          prompt_key?: string | null
          prompt_version?: string
          provenance_json?: Json
          provider?: string | null
          raw_output_text?: string | null
          request_id?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
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
      appointments: {
        Row: {
          cancelled_reason: string | null
          clinic_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          idempotency_key: string | null
          notes: string | null
          owner_id: string
          pet_id: string
          proposed_window: string
          request_id: string | null
          scheduled_at: string | null
          service_id: string | null
          staff_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          cancelled_reason?: string | null
          clinic_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          owner_id: string
          pet_id: string
          proposed_window: string
          request_id?: string | null
          scheduled_at?: string | null
          service_id?: string | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          cancelled_reason?: string | null
          clinic_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          owner_id?: string
          pet_id?: string
          proposed_window?: string
          request_id?: string | null
          scheduled_at?: string | null
          service_id?: string | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_owner_id_fkey"
            columns: ["clinic_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_pet_id_fkey"
            columns: ["clinic_id", "pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_request_id_fkey"
            columns: ["clinic_id", "request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_service_id_fkey"
            columns: ["clinic_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "clinic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          ingestion_attempts: number
          ingestion_completed_at: string | null
          ingestion_error: string | null
          ingestion_queued_at: string | null
          ingestion_status: string
          message_id: string | null
          mime_type: string
          provider: string | null
          provider_media_id: string | null
          request_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          ingestion_attempts?: number
          ingestion_completed_at?: string | null
          ingestion_error?: string | null
          ingestion_queued_at?: string | null
          ingestion_status?: string
          message_id?: string | null
          mime_type: string
          provider?: string | null
          provider_media_id?: string | null
          request_id: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          ingestion_attempts?: number
          ingestion_completed_at?: string | null
          ingestion_error?: string | null
          ingestion_queued_at?: string | null
          ingestion_status?: string
          message_id?: string | null
          mime_type?: string
          provider?: string | null
          provider_media_id?: string | null
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
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          job_title: string | null
          locale: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          job_title?: string | null
          locale?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          job_title?: string | null
          locale?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      clinic_emergency_policies: {
        Row: {
          after_hours_instructions_i18n: Json
          after_hours_phone: string | null
          clinic_id: string
          created_at: string
          emergency_phone: string | null
          emergency_url: string | null
          instructions_i18n: Json
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          after_hours_instructions_i18n?: Json
          after_hours_phone?: string | null
          clinic_id: string
          created_at?: string
          emergency_phone?: string | null
          emergency_url?: string | null
          instructions_i18n?: Json
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          after_hours_instructions_i18n?: Json
          after_hours_phone?: string | null
          clinic_id?: string
          created_at?: string
          emergency_phone?: string | null
          emergency_url?: string | null
          instructions_i18n?: Json
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_emergency_policies_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_holidays: {
        Row: {
          clinic_id: string
          closes_at: string | null
          created_at: string
          holiday_date: string
          id: string
          is_closed: boolean
          name: string | null
          opens_at: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          closes_at?: string | null
          created_at?: string
          holiday_date: string
          id?: string
          is_closed?: boolean
          name?: string | null
          opens_at?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          closes_at?: string | null
          created_at?: string
          holiday_date?: string
          id?: string
          is_closed?: boolean
          name?: string | null
          opens_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_holidays_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_hours: {
        Row: {
          clinic_id: string
          closes_at: string
          created_at: string
          id: string
          is_closed: boolean
          opens_at: string
          updated_at: string
          weekday: number
        }
        Insert: {
          clinic_id: string
          closes_at: string
          created_at?: string
          id?: string
          is_closed?: boolean
          opens_at: string
          updated_at?: string
          weekday: number
        }
        Update: {
          clinic_id?: string
          closes_at?: string
          created_at?: string
          id?: string
          is_closed?: boolean
          opens_at?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_hours_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_web_intake_configs: {
        Row: {
          ai_enabled: boolean
          allowed_origins: string[]
          clinic_id: string
          created_at: string
          default_locale: string
          enabled: boolean
          rate_limit_per_hour: number
          retention_days: number
          updated_at: string
          widget_copy_i18n: Json
        }
        Insert: {
          ai_enabled?: boolean
          allowed_origins?: string[]
          clinic_id: string
          created_at?: string
          default_locale?: string
          enabled?: boolean
          rate_limit_per_hour?: number
          retention_days?: number
          updated_at?: string
          widget_copy_i18n?: Json
        }
        Update: {
          ai_enabled?: boolean
          allowed_origins?: string[]
          clinic_id?: string
          created_at?: string
          default_locale?: string
          enabled?: boolean
          rate_limit_per_hour?: number
          retention_days?: number
          updated_at?: string
          widget_copy_i18n?: Json
        }
        Relationships: [
          {
            foreignKeyName: "clinic_web_intake_configs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
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
      message_delivery_attempts: {
        Row: {
          attempt_number: number
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          completed_at: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          message_id: string | null
          outbound_message_id: string
          payload_json: Json
          provider: string
          provider_message_sid: string | null
          provider_status: string | null
          request_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          attempt_number: number
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          outbound_message_id: string
          payload_json?: Json
          provider?: string
          provider_message_sid?: string | null
          provider_status?: string | null
          request_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempt_number?: number
          channel?: Database["public"]["Enums"]["owner_channel"]
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          outbound_message_id?: string
          payload_json?: Json
          provider?: string
          provider_message_sid?: string | null
          provider_status?: string | null
          request_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_delivery_attempts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_delivery_attempts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_delivery_attempts_outbound_message_id_fkey"
            columns: ["outbound_message_id"]
            isOneToOne: false
            referencedRelation: "outbound_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_delivery_attempts_request_id_fkey"
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
      twilio_media_ingestion_jobs: {
        Row: {
          attachment_id: string
          clinic_id: string
          provider_url: string
          provider_media_id: string | null
          status: string
          attempts: number
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          attachment_id: string
          clinic_id: string
          provider_url: string
          provider_media_id?: string | null
          status?: string
          attempts?: number
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          attachment_id?: string
          clinic_id?: string
          provider_url?: string
          provider_media_id?: string | null
          status?: string
          attempts?: number
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "twilio_media_ingestion_jobs_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: true
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twilio_media_ingestion_jobs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_messages: {
        Row: {
          attempt_count: number
          body: string
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          created_at: string
          created_by: string | null
          fallback_of_outbound_message_id: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          max_attempts: number
          message_id: string | null
          metadata_json: Json
          next_attempt_at: string
          owner_id: string | null
          provider: string
          recipient_phone: string
          reminder_id: string | null
          request_id: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          body: string
          channel: Database["public"]["Enums"]["owner_channel"]
          clinic_id: string
          created_at?: string
          created_by?: string | null
          fallback_of_outbound_message_id?: string | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          max_attempts?: number
          message_id?: string | null
          metadata_json?: Json
          next_attempt_at?: string
          owner_id?: string | null
          provider?: string
          recipient_phone: string
          reminder_id?: string | null
          request_id?: string | null
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          body?: string
          channel?: Database["public"]["Enums"]["owner_channel"]
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          fallback_of_outbound_message_id?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          max_attempts?: number
          message_id?: string | null
          metadata_json?: Json
          next_attempt_at?: string
          owner_id?: string | null
          provider?: string
          recipient_phone?: string
          reminder_id?: string | null
          request_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_fallback_of_outbound_message_id_fkey"
            columns: ["fallback_of_outbound_message_id"]
            isOneToOne: false
            referencedRelation: "outbound_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
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
      owner_invites: {
        Row: {
          clinic_id: string
          consumed_at: string | null
          created_at: string
          created_by_staff_id: string | null
          expires_at: string
          id: string
          phone: string
          token_hash: string
        }
        Insert: {
          clinic_id: string
          consumed_at?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          expires_at: string
          id?: string
          phone: string
          token_hash: string
        }
        Update: {
          clinic_id?: string
          consumed_at?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          expires_at?: string
          id?: string
          phone?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_invites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invites_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "clinic_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_user_identities: {
        Row: {
          created_at: string
          identity_type: string
          identity_value: string
          user_id: string
        }
        Insert: {
          created_at?: string
          identity_type: string
          identity_value: string
          user_id: string
        }
        Update: {
          created_at?: string
          identity_type?: string
          identity_value?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_user_identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "owner_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      owner_user_memberships: {
        Row: {
          clinic_id: string
          joined_at: string
          owner_id: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          joined_at?: string
          owner_id: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          joined_at?: string
          owner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_user_memberships_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_user_memberships_clinic_id_owner_id_fkey"
            columns: ["clinic_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "owner_user_memberships_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "owner_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      owner_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
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
          photo_url: string | null
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
          photo_url?: string | null
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
          photo_url?: string | null
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
          owner_notes: string | null
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
          owner_notes?: string | null
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
          owner_notes?: string | null
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
          source_key: string | null
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
          source_key?: string | null
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
          source_key?: string | null
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
          intake_ai_output_id: string | null
          owner_id: string
          pet_id: string | null
          resolved_at: string | null
          risk_flags_json: Json
          routing_suggestion: string | null
          service_intent: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          urgency: Database["public"]["Enums"]["request_urgency"]
          urgency_suggestion:
            | Database["public"]["Enums"]["request_urgency"]
            | null
          web_intake_session_id: string | null
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
          intake_ai_output_id?: string | null
          owner_id: string
          pet_id?: string | null
          resolved_at?: string | null
          risk_flags_json?: Json
          routing_suggestion?: string | null
          service_intent?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["request_urgency"]
          urgency_suggestion?:
            | Database["public"]["Enums"]["request_urgency"]
            | null
          web_intake_session_id?: string | null
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
          intake_ai_output_id?: string | null
          owner_id?: string
          pet_id?: string | null
          resolved_at?: string | null
          risk_flags_json?: Json
          routing_suggestion?: string | null
          service_intent?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["request_urgency"]
          urgency_suggestion?:
            | Database["public"]["Enums"]["request_urgency"]
            | null
          web_intake_session_id?: string | null
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
            foreignKeyName: "requests_intake_ai_output_id_fkey"
            columns: ["intake_ai_output_id"]
            isOneToOne: false
            referencedRelation: "ai_outputs"
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
          {
            foreignKeyName: "requests_web_intake_session_id_fkey"
            columns: ["web_intake_session_id"]
            isOneToOne: false
            referencedRelation: "web_intake_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          clinic_id: string
          created_at: string
          currency: string
          description_i18n: Json
          duration_minutes: number
          id: string
          is_active: boolean
          name_i18n: Json
          price_cents: number | null
          requires_pet_species: string[]
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          clinic_id: string
          created_at?: string
          currency?: string
          description_i18n?: Json
          duration_minutes: number
          id?: string
          is_active?: boolean
          name_i18n: Json
          price_cents?: number | null
          requires_pet_species?: string[]
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          clinic_id?: string
          created_at?: string
          currency?: string
          description_i18n?: Json
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name_i18n?: Json
          price_cents?: number | null
          requires_pet_species?: string[]
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_weight_entries: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          measured_at: string
          pet_id: string
          source: string
          weight_kg: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          measured_at: string
          pet_id: string
          source: string
          weight_kg: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          measured_at?: string
          pet_id?: string
          source?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_weight_entries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_weight_entries_clinic_id_pet_id_fkey"
            columns: ["clinic_id", "pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      web_intake_sessions: {
        Row: {
          clinic_id: string
          consented_at: string | null
          created_at: string
          id: string
          ip_hash: string | null
          last_seen_at: string
          locale: string
          origin: string | null
          owner_id: string | null
          public_token_hash: string
          referrer: string | null
          request_id: string | null
          status: string
          updated_at: string
          user_agent_hash: string | null
        }
        Insert: {
          clinic_id: string
          consented_at?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          locale?: string
          origin?: string | null
          owner_id?: string | null
          public_token_hash: string
          referrer?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
          user_agent_hash?: string | null
        }
        Update: {
          clinic_id?: string
          consented_at?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          locale?: string
          origin?: string | null
          owner_id?: string | null
          public_token_hash?: string
          referrer?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
          user_agent_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_intake_sessions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_intake_sessions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_intake_sessions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          administered_at: string
          administered_by_staff_id: string | null
          clinic_id: string
          created_at: string
          id: string
          lot_number: string | null
          manufacturer: string | null
          next_due_at: string | null
          notes: string | null
          pet_id: string
          source: string
          updated_at: string
          vaccine_code: string
          vaccine_name: string
        }
        Insert: {
          administered_at: string
          administered_by_staff_id?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          lot_number?: string | null
          manufacturer?: string | null
          next_due_at?: string | null
          notes?: string | null
          pet_id: string
          source?: string
          updated_at?: string
          vaccine_code: string
          vaccine_name: string
        }
        Update: {
          administered_at?: string
          administered_by_staff_id?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          lot_number?: string | null
          manufacturer?: string | null
          next_due_at?: string | null
          notes?: string | null
          pet_id?: string
          source?: string
          updated_at?: string
          vaccine_code?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_administered_by_staff_id_fkey"
            columns: ["administered_by_staff_id"]
            isOneToOne: false
            referencedRelation: "clinic_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_clinic_id_pet_id_fkey"
            columns: ["clinic_id", "pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_clinic_id: { Args: never; Returns: string | null }
      request_appointment: {
        Args: {
          p_pet_id: string
          p_service_id: string
          p_proposed_window: string
          p_notes: string | null
          p_idempotency_key: string | null
        }
        Returns: string
      }
    }
    Enums: {
      appointment_status:
        | "requested"
        | "confirmed"
        | "rescheduled"
        | "completed"
        | "cancelled"
        | "no_show"
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
      service_category:
        | "checkup"
        | "vaccination"
        | "refill"
        | "grooming"
        | "consultation"
        | "surgery"
        | "other"
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
      appointment_status: [
        "requested",
        "confirmed",
        "rescheduled",
        "completed",
        "cancelled",
        "no_show",
      ],
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
      service_category: [
        "checkup",
        "vaccination",
        "refill",
        "grooming",
        "consultation",
        "surgery",
        "other",
      ],
      staff_role: ["owner", "admin", "vet", "tech", "reception", "viewer"],
    },
  },
} as const
