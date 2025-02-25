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

// Helper function to ensure status is one of the allowed values
export function ensureValidStatus(status: string): 'open' | 'in_progress' | 'completed' {
  if (status === 'open' || status === 'in_progress' || status === 'completed') {
    return status;
  }
  return 'open'; // Default to 'open' if invalid status
}

// Type guard to check if a status string is a valid LessonRequest status
export function isValidStatus(status: string): status is 'open' | 'in_progress' | 'completed' {
  return status === 'open' || status === 'in_progress' || status === 'completed';
}

// Type assertion function for tests
export function assertValidStatus(status: string): asserts status is 'open' | 'in_progress' | 'completed' {
  if (!isValidStatus(status)) {
    throw new Error(`Invalid status: ${status}. Must be 'open', 'in_progress', or 'completed'`);
  }
}

export interface LessonRequestVote {
  id: string;
  request_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
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
