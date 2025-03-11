export interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  averageRating: number;
  totalRatings: number;
  created_at: string;
  creator_id: string;
  stripe_product_id?: string;
  stripe_price_id?: string;
  previous_stripe_price_ids?: string[];
  mux_asset_id?: string;
  mux_playback_id?: string;
  mux_upload_id?: string;
  content?: string;
  video_processing_status?: 'pending' | 'processing' | 'ready' | 'error';
  status?: 'draft' | 'published' | 'archived' | 'uploading';
  published?: boolean;
  isFeatured?: boolean;
}

export interface LessonUpdateData {
  title?: string;
  description?: string;
  content?: string;
  price?: number;
  mux_asset_id?: string;
  mux_playback_id?: string;
  stripe_product_id?: string;
  stripe_price_id?: string;
  previous_stripe_price_ids?: string[];
  status?: 'draft' | 'published' | 'archived' | 'uploading';
  video_processing_status?: string;
}

export type LessonRequestStatus = 'open' | 'in_progress' | 'completed';

export interface LessonRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  status: LessonRequestStatus;
  vote_count: number;
  user_id: string;
  instagram_handle?: string;
  tags?: string[];
}

export interface LessonRequestVote {
  id: string;
  request_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}
