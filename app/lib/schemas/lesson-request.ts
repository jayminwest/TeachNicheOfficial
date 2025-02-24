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
  id: z.string().uuid().optional(), // Optional for creation, required for updates
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description cannot exceed 1000 characters"),
  category: z.string({
    required_error: "Please select a category",
    invalid_type_error: "Please select a valid category"
  }),
  instagram_handle: z.string()
    .regex(/^@?[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/, "Invalid Instagram handle")
    .transform(val => val.startsWith('@') ? val : `@${val}`)
    .optional()
    .nullable()
    .or(z.literal('')),
  tags: z.array(z.string()).optional().default([])
})

export type LessonRequestFormData = z.infer<typeof lessonRequestSchema>

export const voteSchema = z.object({
  requestId: z.string().uuid(),
  voteType: z.enum(['upvote', 'downvote'])
})
