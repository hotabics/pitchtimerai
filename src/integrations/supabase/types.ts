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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      feedback_logs: {
        Row: {
          additional_context: Json | null
          created_at: string
          feedback_type: string
          id: string
          is_new_version_better: boolean | null
          metric_name: string | null
          reason: string | null
          script_id: string | null
          session_id: string | null
          undone: boolean | null
        }
        Insert: {
          additional_context?: Json | null
          created_at?: string
          feedback_type: string
          id?: string
          is_new_version_better?: boolean | null
          metric_name?: string | null
          reason?: string | null
          script_id?: string | null
          session_id?: string | null
          undone?: boolean | null
        }
        Update: {
          additional_context?: Json | null
          created_at?: string
          feedback_type?: string
          id?: string
          is_new_version_better?: boolean | null
          metric_name?: string | null
          reason?: string | null
          script_id?: string | null
          session_id?: string | null
          undone?: boolean | null
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          baseline_session_id: string | null
          created_at: string
          duration_minutes: number
          entry_mode: string | null
          events_json: Json | null
          feedback: string[] | null
          filler_breakdown: Json | null
          filler_count: number
          id: string
          idea: string
          improvement_summary_json: Json | null
          jury_questions_json: Json | null
          missed_sections: string[] | null
          original_script: string | null
          original_script_text: string | null
          primary_issue_json: Json | null
          primary_issue_key: string | null
          recording_duration_seconds: number
          score: number
          session_group_id: string | null
          structured_script_json: Json | null
          tone: string | null
          track: string
          transcription: string | null
          transcription_html: string | null
          wpm: number
        }
        Insert: {
          baseline_session_id?: string | null
          created_at?: string
          duration_minutes: number
          entry_mode?: string | null
          events_json?: Json | null
          feedback?: string[] | null
          filler_breakdown?: Json | null
          filler_count?: number
          id?: string
          idea: string
          improvement_summary_json?: Json | null
          jury_questions_json?: Json | null
          missed_sections?: string[] | null
          original_script?: string | null
          original_script_text?: string | null
          primary_issue_json?: Json | null
          primary_issue_key?: string | null
          recording_duration_seconds: number
          score?: number
          session_group_id?: string | null
          structured_script_json?: Json | null
          tone?: string | null
          track: string
          transcription?: string | null
          transcription_html?: string | null
          wpm?: number
        }
        Update: {
          baseline_session_id?: string | null
          created_at?: string
          duration_minutes?: number
          entry_mode?: string | null
          events_json?: Json | null
          feedback?: string[] | null
          filler_breakdown?: Json | null
          filler_count?: number
          id?: string
          idea?: string
          improvement_summary_json?: Json | null
          jury_questions_json?: Json | null
          missed_sections?: string[] | null
          original_script?: string | null
          original_script_text?: string | null
          primary_issue_json?: Json | null
          primary_issue_key?: string | null
          recording_duration_seconds?: number
          score?: number
          session_group_id?: string | null
          structured_script_json?: Json | null
          tone?: string | null
          track?: string
          transcription?: string | null
          transcription_html?: string | null
          wpm?: number
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_baseline_session_id_fkey"
            columns: ["baseline_session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_scripts: {
        Row: {
          audience_label: string | null
          created_at: string
          expires_at: string | null
          id: string
          idea: string
          speech_blocks: Json
          total_words: number | null
          track: string
        }
        Insert: {
          audience_label?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          idea: string
          speech_blocks: Json
          total_words?: number | null
          track: string
        }
        Update: {
          audience_label?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          idea?: string
          speech_blocks?: Json
          total_words?: number | null
          track?: string
        }
        Relationships: []
      }
      suggestion_analytics: {
        Row: {
          id: string
          selected_at: string
          suggestion_text: string
          suggestion_type: string
        }
        Insert: {
          id?: string
          selected_at?: string
          suggestion_text: string
          suggestion_type: string
        }
        Update: {
          id?: string
          selected_at?: string
          suggestion_text?: string
          suggestion_type?: string
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
