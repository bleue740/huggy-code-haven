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
      chat_messages: {
        Row: {
          chat_mode: string | null
          code_applied: boolean | null
          code_line_count: number | null
          content: string
          created_at: string
          id: string
          project_id: string
          role: string
          snapshot_id: string | null
          user_id: string
        }
        Insert: {
          chat_mode?: string | null
          code_applied?: boolean | null
          code_line_count?: number | null
          content: string
          created_at?: string
          id?: string
          project_id: string
          role: string
          snapshot_id?: string | null
          user_id: string
        }
        Update: {
          chat_mode?: string | null
          code_applied?: boolean | null
          code_line_count?: number | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          snapshot_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "project_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      community_showcases: {
        Row: {
          created_at: string
          deploy_url: string
          description: string | null
          expires_at: string
          featured_at: string
          id: string
          project_id: string | null
          score: number | null
          thumbnail_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deploy_url: string
          description?: string | null
          expires_at?: string
          featured_at?: string
          id?: string
          project_id?: string | null
          score?: number | null
          thumbnail_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          deploy_url?: string
          description?: string | null
          expires_at?: string
          featured_at?: string
          id?: string
          project_id?: string | null
          score?: number | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_showcases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      deployments: {
        Row: {
          created_at: string
          custom_domain: string | null
          id: string
          project_id: string | null
          schema_snapshot: Json | null
          slug: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          project_id?: string | null
          schema_snapshot?: Json | null
          slug?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          project_id?: string | null
          schema_snapshot?: Json | null
          slug?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      message_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          message_id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          message_id: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          message_id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      project_collaborators: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          project_id: string
          role: string
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          project_id: string
          role?: string
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          project_id?: string
          role?: string
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_snapshots: {
        Row: {
          created_at: string
          files_snapshot: Json
          id: string
          label: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          files_snapshot?: Json
          id?: string
          label?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          files_snapshot?: Json
          id?: string
          label?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          code: string | null
          created_at: string
          firecrawl_enabled: boolean | null
          id: string
          name: string
          schema: Json | null
          supabase_anon_key: string | null
          supabase_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          firecrawl_enabled?: boolean | null
          id?: string
          name?: string
          schema?: Json | null
          supabase_anon_key?: string | null
          supabase_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          firecrawl_enabled?: boolean | null
          id?: string
          name?: string
          schema?: Json | null
          supabase_anon_key?: string | null
          supabase_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          created_at: string
          credit_tier: number | null
          credits_granted_at: string | null
          current_period_end: string | null
          id: string
          monthly_credits: number | null
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string
          credit_tier?: number | null
          credits_granted_at?: string | null
          current_period_end?: string | null
          id?: string
          monthly_credits?: number | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string
          credit_tier?: number | null
          credits_granted_at?: string | null
          current_period_end?: string | null
          id?: string
          monthly_credits?: number | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users_credits: {
        Row: {
          created_at: string
          credits: number
          daily_credits: number | null
          daily_credits_reset_at: string | null
          id: string
          lifetime_used: number
          monthly_credits: number | null
          topup_credits: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          daily_credits?: number | null
          daily_credits_reset_at?: string | null
          id?: string
          lifetime_used?: number
          monthly_credits?: number | null
          topup_credits?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          daily_credits?: number | null
          daily_credits_reset_at?: string | null
          id?: string
          lifetime_used?: number
          monthly_credits?: number | null
          topup_credits?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: Json
      }
      grant_daily_credits: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: Json
      }
      grant_monthly_credits: {
        Args: { p_amount: number; p_plan?: string; p_user_id: string }
        Returns: Json
      }
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
