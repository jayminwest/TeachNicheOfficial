import * as z from 'zod'

export const lessonRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  category: z.string().min(1, "Category is required")
})

export type LessonRequestFormData = z.infer<typeof lessonRequestSchema>
