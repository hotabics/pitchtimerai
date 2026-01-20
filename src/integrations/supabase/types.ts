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
      analytics_subscribers: {
        Row: {
          created_at: string
          email: string
          frequency: string
          id: string
          is_active: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          best_score: number | null
          challenge_id: string
          id: string
          joined_at: string
          last_pitch_at: string | null
          participant_email: string | null
          participant_name: string
          total_pitches: number | null
        }
        Insert: {
          best_score?: number | null
          challenge_id: string
          id?: string
          joined_at?: string
          last_pitch_at?: string | null
          participant_email?: string | null
          participant_name: string
          total_pitches?: number | null
        }
        Update: {
          best_score?: number | null
          challenge_id?: string
          id?: string
          joined_at?: string
          last_pitch_at?: string | null
          participant_email?: string | null
          participant_name?: string
          total_pitches?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "pitch_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_analysis: {
        Row: {
          content_analysis: Json | null
          created_at: string
          delivery_metrics: Json | null
          duration_seconds: number | null
          id: string
          overall_score: number | null
          pitch_id: string | null
          prompt_mode: string | null
          recommendations: Json | null
          thumbnail_url: string | null
          transcript: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content_analysis?: Json | null
          created_at?: string
          delivery_metrics?: Json | null
          duration_seconds?: number | null
          id?: string
          overall_score?: number | null
          pitch_id?: string | null
          prompt_mode?: string | null
          recommendations?: Json | null
          thumbnail_url?: string | null
          transcript?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content_analysis?: Json | null
          created_at?: string
          delivery_metrics?: Json | null
          duration_seconds?: number | null
          id?: string
          overall_score?: number | null
          pitch_id?: string | null
          prompt_mode?: string | null
          recommendations?: Json | null
          thumbnail_url?: string | null
          transcript?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_analysis_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "saved_pitches"
            referencedColumns: ["id"]
          },
        ]
      }
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
      interrogation_sessions: {
        Row: {
          ammunition_score: number
          choreography_score: number
          cold_bloodedness_score: number
          created_at: string
          dossier_data: Json | null
          id: string
          juror_type: string
          overall_score: number
          questions: Json
          responses: Json
          status: string
          user_id: string | null
          verdict_data: Json
        }
        Insert: {
          ammunition_score: number
          choreography_score: number
          cold_bloodedness_score: number
          created_at?: string
          dossier_data?: Json | null
          id?: string
          juror_type: string
          overall_score: number
          questions: Json
          responses: Json
          status: string
          user_id?: string | null
          verdict_data: Json
        }
        Update: {
          ammunition_score?: number
          choreography_score?: number
          cold_bloodedness_score?: number
          created_at?: string
          dossier_data?: Json | null
          id?: string
          juror_type?: string
          overall_score?: number
          questions?: Json
          responses?: Json
          status?: string
          user_id?: string | null
          verdict_data?: Json
        }
        Relationships: []
      }
      interview_simulation_turns: {
        Row: {
          content: string
          created_at: string
          evidence_used: Json | null
          id: string
          intent: string | null
          missed_opportunities: Json | null
          role: string
          simulation_id: string
          strategic_score: number | null
          suggested_reframe: string | null
          turn_number: number
        }
        Insert: {
          content: string
          created_at?: string
          evidence_used?: Json | null
          id?: string
          intent?: string | null
          missed_opportunities?: Json | null
          role: string
          simulation_id: string
          strategic_score?: number | null
          suggested_reframe?: string | null
          turn_number: number
        }
        Update: {
          content?: string
          created_at?: string
          evidence_used?: Json | null
          id?: string
          intent?: string | null
          missed_opportunities?: Json | null
          role?: string
          simulation_id?: string
          strategic_score?: number | null
          suggested_reframe?: string | null
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_simulation_turns_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "interview_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_simulations: {
        Row: {
          category_scores: Json | null
          company_name: string | null
          conversion_likelihood: string | null
          created_at: string
          cv_content: string
          cv_parsed: Json | null
          duration_seconds: number | null
          ended_at: string | null
          hireability_score: number | null
          id: string
          interviewer_persona: string | null
          job_description: string
          job_requirements: Json | null
          job_title: string
          job_url: string | null
          key_evidence: Json | null
          match_gaps: Json | null
          match_strengths: Json | null
          started_at: string | null
          status: string
          strategic_reframes: Json | null
          updated_at: string
          user_id: string | null
          verdict_summary: string | null
        }
        Insert: {
          category_scores?: Json | null
          company_name?: string | null
          conversion_likelihood?: string | null
          created_at?: string
          cv_content: string
          cv_parsed?: Json | null
          duration_seconds?: number | null
          ended_at?: string | null
          hireability_score?: number | null
          id?: string
          interviewer_persona?: string | null
          job_description: string
          job_requirements?: Json | null
          job_title: string
          job_url?: string | null
          key_evidence?: Json | null
          match_gaps?: Json | null
          match_strengths?: Json | null
          started_at?: string | null
          status?: string
          strategic_reframes?: Json | null
          updated_at?: string
          user_id?: string | null
          verdict_summary?: string | null
        }
        Update: {
          category_scores?: Json | null
          company_name?: string | null
          conversion_likelihood?: string | null
          created_at?: string
          cv_content?: string
          cv_parsed?: Json | null
          duration_seconds?: number | null
          ended_at?: string | null
          hireability_score?: number | null
          id?: string
          interviewer_persona?: string | null
          job_description?: string
          job_requirements?: Json | null
          job_title?: string
          job_url?: string | null
          key_evidence?: Json | null
          match_gaps?: Json | null
          match_strengths?: Json | null
          started_at?: string | null
          status?: string
          strategic_reframes?: Json | null
          updated_at?: string
          user_id?: string | null
          verdict_summary?: string | null
        }
        Relationships: []
      }
      pitch_challenges: {
        Row: {
          created_at: string
          created_by: string
          creator_email: string | null
          description: string | null
          end_date: string
          id: string
          invite_code: string
          start_date: string
          status: string
          target_score: number | null
          title: string
          track: string
        }
        Insert: {
          created_at?: string
          created_by: string
          creator_email?: string | null
          description?: string | null
          end_date?: string
          id?: string
          invite_code?: string
          start_date?: string
          status?: string
          target_score?: number | null
          title: string
          track?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          creator_email?: string | null
          description?: string | null
          end_date?: string
          id?: string
          invite_code?: string
          start_date?: string
          status?: string
          target_score?: number | null
          title?: string
          track?: string
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
          thumbnail_url: string | null
          tone: string | null
          track: string
          transcription: string | null
          transcription_html: string | null
          user_id: string | null
          video_url: string | null
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
          thumbnail_url?: string | null
          tone?: string | null
          track: string
          transcription?: string | null
          transcription_html?: string | null
          user_id?: string | null
          video_url?: string | null
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
          thumbnail_url?: string | null
          tone?: string | null
          track?: string
          transcription?: string | null
          transcription_html?: string | null
          user_id?: string | null
          video_url?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_scripts: {
        Row: {
          call_goal: string | null
          created_at: string
          feedback_items: Json | null
          id: string
          improved_content: string | null
          industry: string | null
          original_content: string
          overall_assessment: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          call_goal?: string | null
          created_at?: string
          feedback_items?: Json | null
          id?: string
          improved_content?: string | null
          industry?: string | null
          original_content: string
          overall_assessment?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          call_goal?: string | null
          created_at?: string
          feedback_items?: Json | null
          id?: string
          improved_content?: string | null
          industry?: string | null
          original_content?: string
          overall_assessment?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sales_simulation_turns: {
        Row: {
          coach_next_action: Json | null
          coach_red_flags: Json | null
          coach_stage_recommendation: string | null
          coach_tips: Json | null
          content: string
          created_at: string
          duration_seconds: number | null
          end_time_seconds: number | null
          id: string
          intent: string | null
          is_objection_response: boolean | null
          is_question: boolean | null
          objection: Json | null
          role: string
          simulation_id: string
          start_time_seconds: number | null
          state_update: Json | null
          turn_number: number
          word_count: number | null
        }
        Insert: {
          coach_next_action?: Json | null
          coach_red_flags?: Json | null
          coach_stage_recommendation?: string | null
          coach_tips?: Json | null
          content: string
          created_at?: string
          duration_seconds?: number | null
          end_time_seconds?: number | null
          id?: string
          intent?: string | null
          is_objection_response?: boolean | null
          is_question?: boolean | null
          objection?: Json | null
          role: string
          simulation_id: string
          start_time_seconds?: number | null
          state_update?: Json | null
          turn_number: number
          word_count?: number | null
        }
        Update: {
          coach_next_action?: Json | null
          coach_red_flags?: Json | null
          coach_stage_recommendation?: string | null
          coach_tips?: Json | null
          content?: string
          created_at?: string
          duration_seconds?: number | null
          end_time_seconds?: number | null
          id?: string
          intent?: string | null
          is_objection_response?: boolean | null
          is_question?: boolean | null
          objection?: Json | null
          role?: string
          simulation_id?: string
          start_time_seconds?: number | null
          state_update?: Json | null
          turn_number?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_simulation_turns_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "sales_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_simulations: {
        Row: {
          call_goal: string
          call_stage: string | null
          client_interest_level: number | null
          client_personality: string
          client_role: string
          client_signals: Json | null
          client_trust_level: number | null
          client_urgency_level: number | null
          close_score: number | null
          coach_suggestions_followed: number | null
          coach_suggestions_shown: number | null
          conversion_likelihood: string | null
          created_at: string
          custom_goal: string | null
          discovery_score: number | null
          duration_seconds: number | null
          ended_at: string | null
          highlights: Json | null
          id: string
          improvements: Json | null
          industry: string
          objection_level: string
          objection_score: number | null
          objections_handled: number | null
          objections_raised: number | null
          opening_score: number | null
          overall_score: number | null
          penalties: Json | null
          product_description: string
          question_count: number | null
          started_at: string | null
          status: string
          talk_ratio: number | null
          timeline_events: Json | null
          updated_at: string
          user_id: string | null
          value_score: number | null
        }
        Insert: {
          call_goal?: string
          call_stage?: string | null
          client_interest_level?: number | null
          client_personality?: string
          client_role: string
          client_signals?: Json | null
          client_trust_level?: number | null
          client_urgency_level?: number | null
          close_score?: number | null
          coach_suggestions_followed?: number | null
          coach_suggestions_shown?: number | null
          conversion_likelihood?: string | null
          created_at?: string
          custom_goal?: string | null
          discovery_score?: number | null
          duration_seconds?: number | null
          ended_at?: string | null
          highlights?: Json | null
          id?: string
          improvements?: Json | null
          industry: string
          objection_level?: string
          objection_score?: number | null
          objections_handled?: number | null
          objections_raised?: number | null
          opening_score?: number | null
          overall_score?: number | null
          penalties?: Json | null
          product_description: string
          question_count?: number | null
          started_at?: string | null
          status?: string
          talk_ratio?: number | null
          timeline_events?: Json | null
          updated_at?: string
          user_id?: string | null
          value_score?: number | null
        }
        Update: {
          call_goal?: string
          call_stage?: string | null
          client_interest_level?: number | null
          client_personality?: string
          client_role?: string
          client_signals?: Json | null
          client_trust_level?: number | null
          client_urgency_level?: number | null
          close_score?: number | null
          coach_suggestions_followed?: number | null
          coach_suggestions_shown?: number | null
          conversion_likelihood?: string | null
          created_at?: string
          custom_goal?: string | null
          discovery_score?: number | null
          duration_seconds?: number | null
          ended_at?: string | null
          highlights?: Json | null
          id?: string
          improvements?: Json | null
          industry?: string
          objection_level?: string
          objection_score?: number | null
          objections_handled?: number | null
          objections_raised?: number | null
          opening_score?: number | null
          overall_score?: number | null
          penalties?: Json | null
          product_description?: string
          question_count?: number | null
          started_at?: string | null
          status?: string
          talk_ratio?: number | null
          timeline_events?: Json | null
          updated_at?: string
          user_id?: string | null
          value_score?: number | null
        }
        Relationships: []
      }
      saved_pitches: {
        Row: {
          audience: string | null
          audience_label: string | null
          created_at: string
          duration_minutes: number
          generation_mode: string | null
          hook_style: string | null
          id: string
          idea: string
          meta: Json | null
          speech_blocks: Json
          title: string
          track: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string | null
          audience_label?: string | null
          created_at?: string
          duration_minutes?: number
          generation_mode?: string | null
          hook_style?: string | null
          id?: string
          idea: string
          meta?: Json | null
          speech_blocks?: Json
          title: string
          track: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string | null
          audience_label?: string | null
          created_at?: string
          duration_minutes?: number
          generation_mode?: string | null
          hook_style?: string | null
          id?: string
          idea?: string
          meta?: Json | null
          speech_blocks?: Json
          title?: string
          track?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      survey_events: {
        Row: {
          answers: Json | null
          created_at: string
          device_type: string | null
          distinct_id: string | null
          event_timestamp: string
          event_type: string
          friction_tags: string[] | null
          goal_type: string | null
          id: string
          nps_score: number | null
          survey_id: string
          trigger: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          device_type?: string | null
          distinct_id?: string | null
          event_timestamp?: string
          event_type: string
          friction_tags?: string[] | null
          goal_type?: string | null
          id?: string
          nps_score?: number | null
          survey_id: string
          trigger?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string
          device_type?: string | null
          distinct_id?: string | null
          event_timestamp?: string
          event_type?: string
          friction_tags?: string[] | null
          goal_type?: string | null
          id?: string
          nps_score?: number | null
          survey_id?: string
          trigger?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
