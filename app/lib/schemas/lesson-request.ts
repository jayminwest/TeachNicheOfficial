import * as z from 'zod'

export const lessonRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description cannot exceed 1000 characters"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional().default([])
})

export type LessonRequestFormData = z.infer<typeof lessonRequestSchema>

export const voteSchema = z.object({
  requestId: z.string().uuid(),
  voteType: z.enum(['upvote', 'downvote'])
})
