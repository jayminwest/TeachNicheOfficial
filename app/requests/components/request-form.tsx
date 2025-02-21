'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { lessonRequestSchema, LessonRequestFormData } from '@/lib/schemas/lesson-request'
import { createRequest } from '@/lib/supabase/requests'

const categories = [
  'Beginner Fundamentals',
  'Advanced Techniques',
  'Competition Skills',
  'Teaching Methods',
  'Other'
]

export function RequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<LessonRequestFormData>({
    resolver: zodResolver(lessonRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      tags: []
    }
  })

  const onSubmit = async (data: LessonRequestFormData) => {
    try {
      setIsSubmitting(true)
      await createRequest(data)
      form.reset()
    } catch (error) {
      console.error('Failed to create request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="What would you like to learn?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the lesson you're looking for..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <select
                  className="w-full p-2 border rounded-md"
                  {...field}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </Form>
  )
}
