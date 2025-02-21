'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/AuthContext'
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

  const { user } = useAuth()

  const onSubmit = async (data: LessonRequestFormData) => {
    try {
      setIsSubmitting(true)
      
      if (!user) {
        throw new Error('You must be logged in to submit a request')
      }

      await createRequest({
        ...data,
        user_id: user.id
      })
      
      form.reset()
      toast({
        title: "Success",
        description: "Your request has been submitted successfully."
      })
    } catch (error: any) {
      console.error('Failed to create request:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive"
      })
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

        <Button 
          type="submit" 
          disabled={isSubmitting || !user}
          title={!user ? "Please log in to submit a request" : ""}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </Form>
  )
}
