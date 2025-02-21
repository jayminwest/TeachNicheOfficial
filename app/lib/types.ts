export interface LessonRequest {
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  status: 'open' | 'in_progress' | 'completed';
  vote_count: number;
  category: string | null;
  tags: string[] | null;
}

export interface LessonRequestVote {
  id: string;
  request_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}
