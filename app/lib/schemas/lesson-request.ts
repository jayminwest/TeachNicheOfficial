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
  instagram_handle?: string;
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
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description cannot exceed 1000 characters"),
  category: z.string().min(1, "Category is required"),
  instagram_handle: z.string().regex(/^@?[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/, "Invalid Instagram handle").optional(),
  tags: z.array(z.string()).optional().default([])
})

export type LessonRequestFormData = z.infer<typeof lessonRequestSchema>

export const voteSchema = z.object({
  requestId: z.string().uuid(),
  voteType: z.enum(['upvote', 'downvote'])
})
