'use client'

import { useState } from 'react'
import { useAuth } from '@/app/services/auth/AuthContext'
import { createRequest } from '@/app/lib/supabase/requests'
import { AuthDialog } from '@/app/components/ui/auth-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { lessonRequestSchema, type LessonRequestFormData, LESSON_CATEGORIES } from "@/app/lib/schemas/lesson-request"
interface RequestDialogProps {
  children: React.ReactNode
}

export function RequestDialog({ children }: RequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const { user } = useAuth()
  
  const form = useForm<LessonRequestFormData>({
    resolver: zodResolver(lessonRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Trick Tutorial', // Set a default category
      instagram_handle: '',
      tags: []
    }
  })

  const onSubmit = async (data: LessonRequestFormData) => {
    try {
      await createRequest(data)
      setOpen(false)
      form.reset()
      // Trigger a page refresh or update
      window.location.reload()
    } catch (error) {
      console.error('Failed to create request:', error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div
            onClick={(e) => {
              if (!user) {
                e.preventDefault()
                setShowAuth(true)
              }
            }}
            className="inline-block w-full"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!user) {
                  setShowAuth(true)
                } else {
                  setOpen(true)
                }
              }
            }}
          >
            {children}
          </div>
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
                    <FormLabel>Preferred Teacher&apos;s Instagram (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="@username (optional)"
                        {...field}
                        value={field.value || ''}
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent 
                        className="max-h-[200px] overflow-y-auto relative z-[9999]"
                        position="popper"
                        sideOffset={5}
                      >
                        {LESSON_CATEGORIES.map((category) => (
                          <SelectItem 
                            key={category} 
                            value={category}
                            className="cursor-pointer"
                          >
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
      <AuthDialog 
        open={showAuth} 
        onOpenChange={setShowAuth}
        defaultView="sign-up"
      />
    </>
  )
}
