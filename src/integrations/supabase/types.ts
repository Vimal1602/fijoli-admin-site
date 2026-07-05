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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      auth_one_time_tokens: {
        Row: {
          consumed_at: string | null
          consumed_ip: unknown | null
          consumed_ua: string | null
          created_at: string | null
          created_ip: unknown | null
          created_ua: string | null
          expires_at: string
          id: string
          maybe_user_id: string | null
          metadata: Json | null
          phone_e164: string | null
          purpose: string
          token_hash: string
        }
        Insert: {
          consumed_at?: string | null
          consumed_ip?: unknown | null
          consumed_ua?: string | null
          created_at?: string | null
          created_ip?: unknown | null
          created_ua?: string | null
          expires_at: string
          id?: string
          maybe_user_id?: string | null
          metadata?: Json | null
          phone_e164?: string | null
          purpose: string
          token_hash: string
        }
        Update: {
          consumed_at?: string | null
          consumed_ip?: unknown | null
          consumed_ua?: string | null
          created_at?: string | null
          created_ip?: unknown | null
          created_ua?: string | null
          expires_at?: string
          id?: string
          maybe_user_id?: string | null
          metadata?: Json | null
          phone_e164?: string | null
          purpose?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_one_time_tokens_maybe_user_id_fkey"
            columns: ["maybe_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip: unknown | null
          last_used_at: string | null
          refresh_hash: string
          revoke_reason: string | null
          revoked_at: string | null
          ua: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip?: unknown | null
          last_used_at?: string | null
          refresh_hash: string
          revoke_reason?: string | null
          revoked_at?: string | null
          ua?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip?: unknown | null
          last_used_at?: string | null
          refresh_hash?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          ua?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_mentions: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          mentioned_user_id: string
          mentioner_user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          mentioner_user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          mentioner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_mentions_mentioner_user_id_fkey"
            columns: ["mentioner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string | null
          id: string
          ip: unknown | null
          phone_e164: string
          result: string
          ua: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip?: unknown | null
          phone_e164: string
          result: string
          ua?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip?: unknown | null
          phone_e164?: string
          result?: string
          ua?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean
          notification_type: string
          parent_comment_id: string | null
          post_id: string | null
          target_user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean
          notification_type: string
          parent_comment_id?: string | null
          post_id?: string | null
          target_user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean
          notification_type?: string
          parent_comment_id?: string | null
          post_id?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          mention_user_ids: string[] | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          mention_user_ids?: string[] | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          mention_user_ids?: string[] | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reason: string | null
          reported_by: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reason?: string | null
          reported_by: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reason?: string | null
          reported_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          currency: string | null
          id: string
          image_url: string | null
          image_urls: Json | null
          likes_count: number | null
          location_scope: string | null
          price: number | null
          target_location: Json | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          currency?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          likes_count?: number | null
          location_scope?: string | null
          price?: number | null
          target_location?: Json | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          likes_count?: number | null
          location_scope?: string | null
          price?: number | null
          target_location?: Json | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      registration_sessions: {
        Row: {
          consumed_at: string | null
          created_at: string | null
          created_ip: unknown | null
          created_ua: string | null
          expires_at: string
          id: string
          maybe_user_id: string | null
          phone_e164: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string | null
          created_ip?: unknown | null
          created_ua?: string | null
          expires_at: string
          id?: string
          maybe_user_id?: string | null
          phone_e164: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string | null
          created_ip?: unknown | null
          created_ua?: string | null
          expires_at?: string
          id?: string
          maybe_user_id?: string | null
          phone_e164?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_sessions_maybe_user_id_fkey"
            columns: ["maybe_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      supports: {
        Row: {
          created_at: string
          id: string
          issue_type: string | null
          number_details: string
          status: string
          support_comment: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_type?: string | null
          number_details: string
          status?: string
          support_comment: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_type?: string | null
          number_details?: string
          status?: string
          support_comment?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credentials: {
        Row: {
          algo: string | null
          created_at: string | null
          password_hash: string
          password_set_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          algo?: string | null
          created_at?: string | null
          password_hash: string
          password_set_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          algo?: string | null
          created_at?: string | null
          password_hash?: string
          password_set_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          dob: string | null
          location: string | null
          role: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dob?: string | null
          location?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dob?: string | null
          location?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone_e164: string
          phone_verified: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone_e164: string
          phone_verified?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone_e164?: string
          phone_verified?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wa_outbound_log: {
        Row: {
          created_at: string | null
          error: Json | null
          id: string
          message_id: string | null
          payload: Json | null
          phone_e164: string
          status: string | null
          template_name: string
        }
        Insert: {
          created_at?: string | null
          error?: Json | null
          id?: string
          message_id?: string | null
          payload?: Json | null
          phone_e164: string
          status?: string | null
          template_name: string
        }
        Update: {
          created_at?: string | null
          error?: Json | null
          id?: string
          message_id?: string | null
          payload?: Json | null
          phone_e164?: string
          status?: string | null
          template_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_users_for_mention: {
        Args: { limit_count?: number; search_term: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
          username: string
        }[]
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
