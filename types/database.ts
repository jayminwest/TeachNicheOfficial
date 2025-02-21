export type LessonStatus = 'draft' | 'published' | 'archived';
export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type VoteType = 'up' | 'down';

export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LessonCategory {
  lesson_id: string;
  category_id: string;
}

export interface LessonRequestVote {
  id: string;
  request_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface LessonRequest {
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  status: 'open' | 'in_progress' | 'completed';
  vote_count: number;
  category: string;
  tags?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  price: number;
  creator_id: string;
  created_at: string;
  updated_at: string;
  stripe_product_id?: string;
  stripe_price_id?: string;
  content?: string;
  content_url?: string;
  thumbnail_url?: string;
  is_featured: boolean;
  status: LessonStatus;
  deleted_at?: string;
  version: number;
  mux_asset_id?: string;
  mux_playback_id?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  social_media_tag?: string;
  created_at: string;
  updated_at: string;
  stripe_account_id?: string;
  deleted_at?: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  lesson_id: string;
  creator_id: string;
  purchase_date: string;
  stripe_session_id: string;
  amount: number;
  platform_fee: number;
  creator_earnings: number;
  payment_intent_id: string;
  fee_percentage: number;
  status: PurchaseStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Review {
  id: string;
  user_id: string;
  lesson_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  signed_up_at: string;
  created_at: string;
}
