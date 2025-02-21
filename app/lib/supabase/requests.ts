import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LessonRequest, LessonRequestVote } from '../types'
import { LessonRequestFormData } from '../schemas/lesson-request'

export async function createRequest(data: LessonRequestFormData) {
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
  
  if (error) throw error
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
  
  // First check for existing vote
  const { data: existingVote } = await supabase
    .from('lesson_request_votes')
    .select()
    .match({ request_id: requestId })
    .single()

  if (existingVote) {
    // Delete existing vote
    const { error: deleteError } = await supabase
      .from('lesson_request_votes')
      .delete()
      .match({ id: existingVote.id })
    if (deleteError) throw deleteError
  }

  // Insert new vote
  const { data, error: insertError } = await supabase
    .from('lesson_request_votes')
    .insert([{ 
      request_id: requestId,
      user_id: supabase.auth.user()?.id,
      vote_type: voteType,
      created_at: new Date().toISOString()
    }])
  
  if (insertError) throw insertError

  // Update vote count
  const { error: updateError } = await supabase
    .rpc('update_vote_count', { request_id: requestId })
  
  if (updateError) throw updateError
  
  return data as LessonRequestVote[]
}
