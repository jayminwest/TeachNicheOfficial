import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LessonRequest, LessonRequestVote } from '@/lib/types'
import { LessonRequestFormData } from '@/lib/schemas/lesson-request'
import { toast } from '@/components/ui/use-toast'

export async function createRequest(data: LessonRequestFormData): Promise<LessonRequest> {
  const supabase = createClientComponentClient()
  const { data: request, error } = await supabase
    .from('lesson_requests')
    .insert([{
      ...data,
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
  sortBy?: string
}) {
  const supabase = createClientComponentClient()
  let query = supabase
    .from('lesson_requests')
    .select('*')
  
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data as LessonRequest[]
}

export async function voteOnRequest(requestId: string, voteType: 'upvote' | 'downvote') {
  const supabase = createClientComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be authenticated to vote')
  }
  
  // First check for existing vote
  const { data: existingVote } = await supabase
    .from('lesson_request_votes')
    .select()
    .match({ 
      request_id: requestId,
      user_id: user.id 
    })
    .single()

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Delete existing vote if same type
      const { error: deleteError } = await supabase
        .from('lesson_request_votes')
        .delete()
        .match({ id: existingVote.id })
      if (deleteError) throw deleteError
    } else {
      // Update vote type if different
      const { error: updateError } = await supabase
        .from('lesson_request_votes')
        .update({ vote_type: voteType })
        .match({ id: existingVote.id })
      if (updateError) throw updateError
    }
  } else {
    // Insert new vote
    const { error: insertError } = await supabase
      .from('lesson_request_votes')
      .insert([{ 
        request_id: requestId,
        user_id: user.id,
        vote_type: voteType,
        created_at: new Date().toISOString()
      }])
    if (insertError) throw insertError
  }

  // Update vote count
  const { error: updateError } = await supabase
    .rpc('update_vote_count', { request_id: requestId })
  
  if (updateError) throw updateError
}
