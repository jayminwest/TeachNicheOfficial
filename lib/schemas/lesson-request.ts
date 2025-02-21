import * as z from 'zod'

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
