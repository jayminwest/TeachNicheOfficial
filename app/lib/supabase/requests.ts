import { getFirebaseAuth } from '@supabase/auth-helpers-nextjs'
import type { LessonRequest, LessonRequestFormData } from '@/app/lib/schemas/lesson-request'
import { toast } from '@/app/components/ui/use-toast'

export async function createRequest(data: Omit<LessonRequestFormData, 'id'>): Promise<LessonRequest> {
  const supabase = getFirebaseAuth()
  
  const { data: session } = await firebaseAuth.getSession()
  if (!session?.session?.user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to create a lesson request",
      variant: "destructive"
    })
    throw new Error('Authentication required')
  }
  const { data: request, error } = await supabase
    .from('lesson_requests')
    .insert([{
      ...data,
      user_id: session.session.user.id,
      status: 'open',
      vote_count: 0,
      created_at: new Date().toISOString()
    }])
    .select()
    .single()
    
  if (error) {
    toast({
      title: "Error creating request",
      description: error.message,
      variant: "destructive"
    })
    throw error
  }
  
  toast({
    title: "Request created",
    description: "Your lesson request has been submitted successfully."
  })
  
  return request as LessonRequest
}

export async function getRequests(filters?: {
  category?: string,
  status?: string,
  sortBy?: 'popular' | 'newest'
}) {
  const supabase = getFirebaseAuth()
  let query = supabase
    .from('lesson_requests')
    .select('*, lesson_request_votes(count)')
  
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  // Apply sorting
  if (filters?.sortBy === 'popular') {
    query = query.order('vote_count', { ascending: false })
  } else {
    // Default to newest
    query = query.order('created_at', { ascending: false })
  }
  
  const { data, error } = await query
  if (error) throw error
  return data as LessonRequest[]
}

export async function updateRequest(id: string, data: Omit<LessonRequestFormData, 'id'>): Promise<LessonRequest> {
  const supabase = getFirebaseAuth()
  
  const { data: session } = await firebaseAuth.getSession()
  if (!session?.session?.user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to update a lesson request",
      variant: "destructive"
    })
    throw new Error('Authentication required')
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('lesson_requests')
    .select()
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== session.session.user.id) {
    toast({
      title: "Unauthorized",
      description: "You can only edit your own requests",
      variant: "destructive"
    })
    throw new Error('Unauthorized')
  }

  const { data: request, error } = await supabase
    .from('lesson_requests')
    .update(data)
    .eq('id', id)
    .select()
    .single()
    
  if (error) {
    toast({
      title: "Error updating request",
      description: error.message,
      variant: "destructive"
    })
    throw error
  }
  
  toast({
    title: "Request updated",
    description: "Your lesson request has been updated successfully."
  })
  
  return request as LessonRequest
}

export async function deleteRequest(id: string): Promise<void> {
  const supabase = getFirebaseAuth()
  
  const { data: session } = await firebaseAuth.getSession()
  if (!session?.session?.user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to delete a lesson request",
      variant: "destructive"
    })
    throw new Error('Authentication required')
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('lesson_requests')
    .select()
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== session.session.user.id) {
    toast({
      title: "Unauthorized",
      description: "You can only delete your own requests",
      variant: "destructive"
    })
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('lesson_requests')
    .delete()
    .eq('id', id)
    
  if (error) {
    toast({
      title: "Error deleting request",
      description: error.message,
      variant: "destructive"
    })
    throw error
  }
  
  toast({
    title: "Request deleted",
    description: "Your lesson request has been deleted successfully."
  })
}

export async function voteOnRequest(requestId: string, voteType: 'upvote' | 'downvote') {
  console.log('Starting vote process for request:', requestId, 'type:', voteType)
  
  const response = await fetch('/api/requests/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ requestId, voteType }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Vote request failed:', {
      status: response.status,
      statusText: response.statusText,
      error
    });
    throw new Error(error.error || error.message || 'Failed to submit vote')
  }

  const result = await response.json()
  console.log('Vote response:', result)
  return result
}
