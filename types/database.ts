export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      course_catalogue: {
        Row: {
          id: number;
          title: string;
          category: string;
          educator: string | null;
          price: number | null;
          thumbnail_url: string | null;
          telegram_url: string | null;
          initial_likes: number;
          initial_dislikes: number;
          created_at: string | null;
          rating: number;
          review_count: number;
          is_published: boolean;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          category: string;
          educator?: string | null;
          price?: number | null;
          thumbnail_url?: string | null;
          telegram_url?: string | null;
          initial_likes?: number;
          initial_dislikes?: number;
          created_at?: string | null;
          rating?: number;
          review_count?: number;
          is_published?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          category?: string;
          educator?: string | null;
          price?: number | null;
          thumbnail_url?: string | null;
          telegram_url?: string | null;
          initial_likes?: number;
          initial_dislikes?: number;
          created_at?: string | null;
          rating?: number;
          review_count?: number;
          is_published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_reactions: {
        Row: {
          course_id: number;
          session_id: string;
          reaction: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          course_id: number;
          session_id: string;
          reaction: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          course_id?: number;
          session_id?: string;
          reaction?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: number;
          title: string;
          body: string;
          type: string | null;
          created_at: string | null;
          is_published: boolean;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          body: string;
          type?: string | null;
          created_at?: string | null;
          is_published?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          body?: string;
          type?: string | null;
          created_at?: string | null;
          is_published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          email: string;
          role: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: number;
          code: string;
          discount_percent: number;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          code: string;
          discount_percent: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          code?: string;
          discount_percent?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: number;
          admin_user_id: string;
          action: string;
          entity: string;
          entity_id: number | null;
          detail: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          admin_user_id: string;
          action: string;
          entity: string;
          entity_id?: number | null;
          detail?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          admin_user_id?: string;
          action?: string;
          entity?: string;
          entity_id?: number | null;
          detail?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_course_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_course_reaction_counts: {
        Args: { course_ids: number[] };
        Returns: Array<{ course_id: number; likes: number; dislikes: number }>;
      };
      set_course_reaction: {
        Args: { p_course_id: number; p_session_id: string; p_reaction: string };
        Returns: Array<{ course_id: number; likes: number; dislikes: number; user_reaction: string | null }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
