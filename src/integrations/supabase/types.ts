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
      bible_verses: {
        Row: {
          book: string
          chapter: number
          created_at: string
          id: string
          updated_at: string
          verse_number: number
          verse_text: string
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string
          id?: string
          updated_at?: string
          verse_number: number
          verse_text: string
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string
          id?: string
          updated_at?: string
          verse_number?: number
          verse_text?: string
        }
        Relationships: []
      }
      completed_chapters: {
        Row: {
          book_key: string
          chapter: number
          completed_at: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          book_key: string
          chapter: number
          completed_at?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          book_key?: string
          chapter?: number
          completed_at?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          currency: string
          donated_at: string
          id: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          donated_at?: string
          id?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          donated_at?: string
          id?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fasting_reminders: {
        Row: {
          created_at: string
          event_date: string
          event_name: string
          event_tradition: string
          event_type: string
          id: string
          reminder_days_before: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_name: string
          event_tradition: string
          event_type: string
          id?: string
          reminder_days_before?: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_name?: string
          event_tradition?: string
          event_type?: string
          id?: string
          reminder_days_before?: number
          user_id?: string
        }
        Relationships: []
      }
      friend_activities: {
        Row: {
          activity_data: Json
          activity_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_data?: Json
          activity_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_data?: Json
          activity_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      history_highlights: {
        Row: {
          campaign_id: string
          created_at: string
          highlight_color: string | null
          id: string
          island_id: string
          sentence_index: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          highlight_color?: string | null
          id?: string
          island_id: string
          sentence_index: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          highlight_color?: string | null
          id?: string
          island_id?: string
          sentence_index?: number
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          attachments: Json | null
          content: string | null
          created_at: string
          folder_id: string | null
          id: string
          pinned: boolean
          pinned_media_type: string | null
          pinned_media_url: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          pinned?: boolean
          pinned_media_type?: string | null
          pinned_media_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          pinned?: boolean
          pinned_media_type?: string | null
          pinned_media_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "journal_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_notifications: {
        Row: {
          created_at: string
          id: string
          month_date: string
          passed_by_user_id: string
          read: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_date: string
          passed_by_user_id: string
          read?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_date?: string
          passed_by_user_id?: string
          read?: boolean
          user_id?: string
        }
        Relationships: []
      }
      monthly_leaderboard: {
        Row: {
          chapters_completed: number | null
          created_at: string
          history_islands_completed: number | null
          id: string
          month_date: string
          saints_read_count: number | null
          streak_penalty_applied: boolean | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chapters_completed?: number | null
          created_at?: string
          history_islands_completed?: number | null
          id?: string
          month_date: string
          saints_read_count?: number | null
          streak_penalty_applied?: boolean | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chapters_completed?: number | null
          created_at?: string
          history_islands_completed?: number | null
          id?: string
          month_date?: string
          saints_read_count?: number | null
          streak_penalty_applied?: boolean | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orthodox_history_progress: {
        Row: {
          campaign_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          island_id: string
          quiz_score: number | null
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          campaign_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          island_id: string
          quiz_score?: number | null
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          campaign_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          island_id?: string
          quiz_score?: number | null
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      pinned_prayers: {
        Row: {
          filter_context: string
          id: string
          pinned_at: string
          prayer_id: string
          user_id: string
        }
        Insert: {
          filter_context?: string
          id?: string
          pinned_at?: string
          prayer_id: string
          user_id: string
        }
        Update: {
          filter_context?: string
          id?: string
          pinned_at?: string
          prayer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      prayer_highlights: {
        Row: {
          created_at: string
          highlight_color: string
          id: string
          prayer_id: string
          sentence_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          highlight_color: string
          id?: string
          prayer_id: string
          sentence_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          highlight_color?: string
          id?: string
          prayer_id?: string
          sentence_index?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          fasting_notifications_enabled: boolean | null
          fasting_reminder_days: number[] | null
          friends_notifications_enabled: boolean | null
          id: string
          journal_view_mode: string | null
          profile_picture_url: string | null
          streak_notifications_enabled: boolean | null
          updated_at: string
          username: string | null
          wednesday_notifications_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          fasting_notifications_enabled?: boolean | null
          fasting_reminder_days?: number[] | null
          friends_notifications_enabled?: boolean | null
          id: string
          journal_view_mode?: string | null
          profile_picture_url?: string | null
          streak_notifications_enabled?: boolean | null
          updated_at?: string
          username?: string | null
          wednesday_notifications_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          fasting_notifications_enabled?: boolean | null
          fasting_reminder_days?: number[] | null
          friends_notifications_enabled?: boolean | null
          id?: string
          journal_view_mode?: string | null
          profile_picture_url?: string | null
          streak_notifications_enabled?: boolean | null
          updated_at?: string
          username?: string | null
          wednesday_notifications_enabled?: boolean | null
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_key: string | null
          completed: boolean | null
          created_at: string | null
          current_chapter: number | null
          current_verse: number | null
          id: string
          last_read_at: string | null
          progress: number | null
          scripture_passage: string
          scripture_title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_key?: string | null
          completed?: boolean | null
          created_at?: string | null
          current_chapter?: number | null
          current_verse?: number | null
          id?: string
          last_read_at?: string | null
          progress?: number | null
          scripture_passage: string
          scripture_title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_key?: string | null
          completed?: boolean | null
          created_at?: string | null
          current_chapter?: number | null
          current_verse?: number | null
          id?: string
          last_read_at?: string | null
          progress?: number | null
          scripture_passage?: string
          scripture_title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saints_read: {
        Row: {
          created_at: string
          id: string
          read_at: string
          saint_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          read_at?: string
          saint_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          read_at?: string
          saint_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_avatars: {
        Row: {
          beard_option: string
          created_at: string
          equipped_armor: Json
          eye_color: string
          gender: string
          hairstyle: string
          hearts: number
          id: string
          outfit_palette: string
          skin_tone: string
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          beard_option?: string
          created_at?: string
          equipped_armor?: Json
          eye_color?: string
          gender?: string
          hairstyle?: string
          hearts?: number
          id?: string
          outfit_palette?: string
          skin_tone?: string
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          beard_option?: string
          created_at?: string
          equipped_armor?: Json
          eye_color?: string
          gender?: string
          hairstyle?: string
          hearts?: number
          id?: string
          outfit_palette?: string
          skin_tone?: string
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_phone_numbers: {
        Row: {
          created_at: string
          id: string
          phone_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string
          updated_at?: string
          user_id?: string
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
      user_streak_reminders: {
        Row: {
          created_at: string
          enabled: boolean
          hour: number
          id: string
          minute: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          hour: number
          id?: string
          minute: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          hour?: number
          id?: string
          minute?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          guardian_angel_percentage: number | null
          guardian_angel_saves: number | null
          id: string
          last_activity_date: string | null
          last_completion_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          guardian_angel_percentage?: number | null
          guardian_angel_saves?: number | null
          id?: string
          last_activity_date?: string | null
          last_completion_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          guardian_angel_percentage?: number | null
          guardian_angel_saves?: number | null
          id?: string
          last_activity_date?: string | null
          last_completion_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verse_bookmarks: {
        Row: {
          chapter: number
          created_at: string
          id: string
          scripture_title: string
          user_id: string
          verse_number: number
        }
        Insert: {
          chapter: number
          created_at?: string
          id?: string
          scripture_title: string
          user_id: string
          verse_number: number
        }
        Update: {
          chapter?: number
          created_at?: string
          id?: string
          scripture_title?: string
          user_id?: string
          verse_number?: number
        }
        Relationships: []
      }
      verse_highlights: {
        Row: {
          chapter: number
          created_at: string
          highlight_color: string | null
          id: string
          scripture_title: string
          user_id: string
          verse_number: number
        }
        Insert: {
          chapter: number
          created_at?: string
          highlight_color?: string | null
          id?: string
          scripture_title: string
          user_id: string
          verse_number: number
        }
        Update: {
          chapter?: number
          created_at?: string
          highlight_color?: string | null
          id?: string
          scripture_title?: string
          user_id?: string
          verse_number?: number
        }
        Relationships: []
      }
      verse_of_the_day: {
        Row: {
          created_at: string
          date: string
          id: string
          verse_reference: string
          verse_text: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          verse_reference: string
          verse_text: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          verse_reference?: string
          verse_text?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_account: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
