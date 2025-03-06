export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_category: {
        Row: {
          category_id: string
          lesson_id: string
        }
        Insert: {
          category_id: string
          lesson_id: string
        }
        Update: {
          category_id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_category_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_request_votes: {
        Row: {
          created_at: string | null
          id: string
          request_id: string | null
          user_id: string | null
          vote_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          request_id?: string | null
          user_id?: string | null
          vote_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          request_id?: string | null
          user_id?: string | null
          vote_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "lesson_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_requests: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          id: string
          status: string | null
          tags: string[] | null
          title: string
          user_id: string | null
          vote_count: number | null
          instagram_handle: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          status?: string | null
          tags?: string[] | null
          title: string
          user_id?: string | null
          vote_count?: number | null
          instagram_handle?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          user_id?: string | null
          vote_count?: number | null
          instagram_handle?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: string | null
          content_url: string | null
          created_at: string
          creator_id: string
          deleted_at: string | null
          description: string | null
          id: string
          is_featured: boolean
          mux_asset_id: string | null
          mux_playback_id: string | null
          price: number
          status: Database["public"]["Enums"]["lesson_status"]
          stripe_price_id: string | null
          stripe_product_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          version: number
          video_processing_status: string | null
        }
        Insert: {
          content?: string | null
          content_url?: string | null
          created_at?: string
          creator_id: string
          deleted_at?: string | null
          description?: string | null
          id: string
          is_featured?: boolean
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          price: number
          status?: Database["public"]["Enums"]["lesson_status"]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          version?: number
          video_processing_status?: string | null
        }
        Update: {
          content?: string | null
          content_url?: string | null
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          price?: number
          status?: Database["public"]["Enums"]["lesson_status"]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          version?: number
          video_processing_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          social_media_tag: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_account_details: Json | null
          stripe_onboarding_complete: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          id: string
          social_media_tag?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_account_details?: Json | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          social_media_tag?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_account_details?: Json | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string
          creator_earnings: number
          creator_id: string
          fee_percentage: number
          id: string
          lesson_id: string
          metadata: Json | null
          payment_intent_id: string
          platform_fee: number
          purchase_date: string
          status: Database["public"]["Enums"]["purchase_status"]
          stripe_session_id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          amount: number
          created_at?: string
          creator_earnings: number
          creator_id: string
          fee_percentage: number
          id: string
          lesson_id: string
          metadata?: Json | null
          payment_intent_id: string
          platform_fee: number
          purchase_date?: string
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_session_id: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          amount?: number
          created_at?: string
          creator_earnings?: number
          creator_id?: string
          fee_percentage?: number
          id?: string
          lesson_id?: string
          metadata?: Json | null
          payment_intent_id?: string
          platform_fee?: number
          purchase_date?: string
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_session_id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          lesson_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id: string
          lesson_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_earnings: {
        Row: {
          id: string
          creator_id: string
          payment_intent_id: string
          amount: number
          lesson_id: string
          status: string
          created_at: string | null
          updated_at: string | null
          payout_id: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          payment_intent_id: string
          amount: number
          lesson_id: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
          payout_id?: string | null
        }
        Update: {
          id?: string
          creator_id?: string
          payment_intent_id?: string
          amount?: number
          lesson_id?: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
          payout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          }
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          signed_up_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          signed_up_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          signed_up_at?: string
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
      lesson_status: "draft" | "published" | "archived"
      purchase_status: "pending" | "completed" | "failed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
