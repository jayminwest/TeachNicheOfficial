import * as z from 'zod'

export const lessonRequestSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export type LessonRequestFormData = z.infer<typeof lessonRequestSchema>
