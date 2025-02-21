'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { lessonRequestSchema, type LessonRequestFormData } from "@/app/lib/schemas/lesson-request"
import { PlusCircle } from 'lucide-react'

interface RequestDialogProps {
  onRequestCreated: () => void
}

export function RequestDialog({ onRequestCreated }: RequestDialogProps) {
  const [open, setOpen] = useState(false)
  
  const form = useForm<LessonRequestFormData>({
    resolver: zodResolver(lessonRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      instagram_handle: '',
      tags: []
    }
  })

  const onSubmit = async (data: LessonRequestFormData) => {
    try {
      // TODO: Add your Supabase create request call here
      setOpen(false)
      form.reset()
      onRequestCreated()
    } catch (error) {
      console.error('Failed to create request:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-5 w-5" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Lesson Request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter lesson title..." {...field} />
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
                      placeholder="Describe what you'd like to learn..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram_handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Teacher's Instagram</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="@username" 
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
                    <Input placeholder="Enter category..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Submit Request
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
