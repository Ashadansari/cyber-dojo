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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: string
          condition_type: string
          condition_value: number
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          category?: string
          condition_type: string
          condition_value?: number
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          condition_type?: string
          condition_value?: number
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      labs: {
        Row: {
          category: string
          created_at: string | null
          creator: string | null
          description: string | null
          difficulty: string
          id: string
          is_active: boolean | null
          points: number | null
          tags: string[] | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          creator?: string | null
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean | null
          points?: number | null
          tags?: string[] | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          creator?: string | null
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean | null
          points?: number | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          difficulty: string
          estimated_hours: number | null
          icon: string | null
          id: string
          title: string
          total_modules: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          difficulty?: string
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          title: string
          total_modules?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          title?: string
          total_modules?: number | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          learning_path_id: string
          order_index: number | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          learning_path_id: string
          order_index?: number | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          learning_path_id?: string
          order_index?: number | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges_earned: number | null
          bio: string | null
          completed_labs: number | null
          created_at: string | null
          display_name: string | null
          id: string
          level: number | null
          rank: string | null
          streak_days: number | null
          updated_at: string | null
          user_id: string
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          badges_earned?: number | null
          bio?: string | null
          completed_labs?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          level?: number | null
          rank?: string | null
          streak_days?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          badges_earned?: number | null
          bio?: string | null
          completed_labs?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          level?: number | null
          rank?: string | null
          streak_days?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lab_completions: {
        Row: {
          completed_at: string | null
          flag_submitted: string | null
          id: string
          lab_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          flag_submitted?: string | null
          id?: string
          lab_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          flag_submitted?: string | null
          id?: string
          lab_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lab_completions_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_path_progress: {
        Row: {
          completed_at: string | null
          completed_modules: number | null
          id: string
          learning_path_id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_modules?: number | null
          id?: string
          learning_path_id: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_modules?: number | null
          id?: string
          learning_path_id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_path_progress_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_level: { Args: { xp_total: number }; Returns: number }
      calculate_rank: { Args: { lvl: number }; Returns: string }
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
