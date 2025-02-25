export interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  averageRating: number;
  totalRatings: number;
  created_at: string;
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
