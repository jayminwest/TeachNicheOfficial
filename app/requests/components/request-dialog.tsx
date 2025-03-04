'use client'

import { useState, useEffect } from 'react'
import { useCategories } from '@/app/hooks/useCategories'
import { useAuth } from '@/app/services/auth/AuthContext'
import { createRequest, deleteRequest, updateRequest } from '@/app/lib/supabase/requests'
import { type LessonRequest } from '@/app/lib/schemas/lesson-request'
import { AuthDialog } from '@/app/components/ui/auth-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { lessonRequestSchema, type LessonRequestFormData } from "@/app/lib/schemas/lesson-request"
interface RequestDialogProps {
  children: React.ReactNode
  request?: LessonRequest
  mode?: 'create' | 'edit'
}

export function RequestDialog({ children, request, mode = 'create' }: RequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const { user } = useAuth();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  
  const form = useForm<LessonRequestFormData>({
    resolver: zodResolver(lessonRequestSchema),
    defaultValues: request ? {
      id: request.id,
      title: request.title,
      description: request.description,
      category: request.category,
      instagram_handle: request.instagram_handle || '',
      tags: request.tags || []
    } : {
      title: '',
      description: '',
      category: '',  // We'll set this after categories load
      instagram_handle: '',
      tags: []
    }
  })
  
  // Set default category after categories load
  useEffect(() => {
    if (!request && categories.length > 0 && !form.getValues('category')) {
      form.setValue('category', categories[0].name);
    }
  }, [categories, form, request]);

  const onSubmit = async (data: LessonRequestFormData) => {
    try {
      if (mode === 'edit' && request) {
        const updateData = {
          title: data.title,
          description: data.description,
          category: data.category,
          instagram_handle: data.instagram_handle || '',
          tags: data.tags || []
        }
        await updateRequest(request.id, updateData)
      } else {
        await createRequest(data)
      }
      setOpen(false)
      form.reset()
      window.location.reload()
    } catch (error) {
      console.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} request:`, error)
      throw error // Re-throw to trigger form error handling
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger 
          asChild 
          data-testid="new-request-button"
          onClick={(e) => {
            if (!user) {
              e.preventDefault()
              setShowAuth(true)
            }
          }}
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
          role="button"
          tabIndex={0}
        >
          {children}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Edit Lesson Request' : 'Create New Lesson Request'}</DialogTitle>
            <DialogDescription>
              Fill out the details for your lesson request below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-2" role="form">
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
                  <FormItem className="relative">
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      defaultValue={field.value}
                      disabled={categoriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select a category"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper"
                        sideOffset={5}
                        className="w-[var(--radix-select-trigger-width)] max-h-[300px] touch-manipulation"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        {categoriesError ? (
                          <SelectItem value="error" disabled>Error loading categories</SelectItem>
                        ) : categoriesLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : categories.length === 0 ? (
                          <SelectItem value="no-categories" disabled>No categories found</SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.name}
                              className="cursor-pointer touch-manipulation"
                            >
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                {mode === 'edit' && request && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this request?')) {
                        try {
                          await deleteRequest(request.id)
                          setOpen(false)
                          window.location.reload()
                        } catch (error) {
                          // Log the detailed error for debugging
                          console.error('Failed to delete request:', 
                            error instanceof Error ? error.message : JSON.stringify(error))
                          
                          // No need to show another toast as deleteRequest already shows one
                        }
                      }
                    }}
                  >
                    Delete Request
                  </Button>
                )}
                <Button type="submit" className={mode === 'edit' ? 'ml-auto' : ''}>
                  {mode === 'edit' ? 'Save Changes' : 'Submit Request'}
                </Button>
              </div>
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
