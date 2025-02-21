import * as z from 'zod'

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

export interface LessonRequestVote {
  id: string;
  request_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

export const lessonRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  category: z.string().min(1, "Category is required")
})

export const voteSchema = z.object({
  requestId: z.string(),
  voteType: z.enum(['upvote', 'downvote'])
})

export type LessonRequestFormData = z.infer<typeof lessonRequestSchema>
