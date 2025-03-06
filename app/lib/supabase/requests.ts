import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { LessonRequest, LessonRequestFormData } from '@/app/lib/schemas/lesson-request'
import { toast } from '@/app/components/ui/use-toast'
import type { RequestVoteResponse } from '@/app/types/request'

export async function createRequest(data: Omit<LessonRequestFormData, 'id'>): Promise<LessonRequest> {
  const supabase = createClientComponentClient()
  let requestData: LessonRequest | null = null;
  
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a lesson request",
        variant: "destructive"
      })
      throw new Error('Authentication required')
    }
    
    // Log the data being sent to help debug
    console.log('Creating request with data:', {
      ...data,
      user_id: session.session.user.id,
      status: 'open',
      vote_count: 0
    });
    
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
      console.error('Supabase error creating request:', error);
      toast({
        title: "Error creating request",
        description: error.message || "Database error occurred",
        variant: "destructive"
      })
      throw new Error(`Failed to create request: ${error.message || JSON.stringify(error)}`)
    }
    
    if (!request) {
      console.error('No request data returned from Supabase');
      toast({
        title: "Error creating request",
        description: "No data returned from database",
        variant: "destructive"
      })
      throw new Error('Failed to create request: No data returned')
    }
    
    requestData = request as LessonRequest;
    
    toast({
      title: "Request created",
      description: "Your lesson request has been submitted successfully."
    })
    
    return requestData;
  } catch (err) {
    // Catch and log any other errors
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error in createRequest:', err);
    toast({
      title: "Error creating request",
      description: errorMessage,
      variant: "destructive"
    })
    throw new Error(`Failed to create request: ${errorMessage}`)
  }
}

export async function getRequests(filters?: {
  category?: string,
  status?: string,
  sortBy?: 'popular' | 'newest'
}) {
  const supabase = createClientComponentClient()
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
  const supabase = createClientComponentClient()
  
  const { data: session } = await supabase.auth.getSession()
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

export async function deleteRequest(id: string): Promise<{ success: boolean }> {
  const supabase = createClientComponentClient()
  
  const { data: session } = await supabase.auth.getSession()
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

  try {
    console.log(`Starting deletion process for request ID: ${id}`);
    
    // First, delete all related votes for this request
    console.log(`Deleting votes for request ID: ${id}`);
    const { data: votesData, error: votesDeleteError } = await supabase
      .from('lesson_request_votes')
      .delete()
      .eq('request_id', id)
      .select()
    
    if (votesDeleteError) {
      console.error('Error deleting related votes:', votesDeleteError);
      toast({
        title: "Error deleting request",
        description: "Failed to delete related votes. Please try again.",
        variant: "destructive"
      })
      throw new Error(`Failed to delete related votes: ${votesDeleteError.message}`)
    }
    
    console.log(`Successfully deleted ${votesData?.length || 0} votes`);
    
    // Now delete the request itself
    console.log(`Deleting request with ID: ${id}`);
    const { data: requestData, error: requestDeleteError } = await supabase
      .from('lesson_requests')
      .delete()
      .eq('id', id)
      .select()
      
    if (requestDeleteError) {
      console.error('Supabase delete error:', requestDeleteError);
      toast({
        title: "Error deleting request",
        description: requestDeleteError.message || "Unknown database error",
        variant: "destructive"
      })
      throw new Error(`Failed to delete request: ${requestDeleteError.message || JSON.stringify(requestDeleteError)}`)
    }
    
    console.log('Request deleted successfully:', requestData);
    
    toast({
      title: "Request deleted",
      description: "Your lesson request has been deleted successfully."
    })
    
    return { success: true };
  } catch (error) {
    // Handle any other errors that might occur
    console.error('Error in delete operation:', error);
    
    // Otherwise create a new error
    toast({
      title: "Error deleting request",
      description: error instanceof Error ? error.message : "An unexpected error occurred",
      variant: "destructive"
    })
    
    // If it's already a formatted error from our code, just rethrow it
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Failed to delete request: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
  }
  
  return { success: false };
}

export async function voteOnRequest(requestId: string, voteType: 'upvote' | 'downvote'): Promise<RequestVoteResponse> {
  const supabase = createClientComponentClient()
  
  // Check authentication before making the request
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to vote on lesson requests",
      variant: "destructive"
    })
    return {
      success: false,
      currentVotes: 0,
      userHasVoted: false,
      error: 'unauthenticated'
    }
  }
  
  console.log('Starting vote process for request:', requestId, 'type:', voteType)
  
  try {
    const response = await fetch('/api/requests/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add CSRF protection
        'X-CSRF-Protection': '1',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ requestId, voteType }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Vote request failed:', {
        status: response.status,
        statusText: response.statusText,
        result
      });
      
      // Handle specific error types
      if (response.status === 401) {
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive"
        })
        return {
          success: false,
          currentVotes: 0,
          userHasVoted: false,
          error: 'unauthenticated'
        }
      } else if (response.status === 429) {
        toast({
          title: "Rate Limited",
          description: "You've made too many requests. Please try again later.",
          variant: "destructive"
        })
        return {
          success: false,
          currentVotes: 0,
          userHasVoted: false,
          error: 'rate_limited'
        }
      } else if (response.status === 409) {
        toast({
          title: "Already Voted",
          description: "You have already voted on this request",
          variant: "destructive"
        })
        return {
          success: false,
          currentVotes: result.currentVotes || 0,
          userHasVoted: true,
          error: 'already_voted'
        }
      }
      
      toast({
        title: "Error",
        description: result.error || "Failed to submit vote",
        variant: "destructive"
      })
      
      return {
        success: false,
        currentVotes: 0,
        userHasVoted: false,
        error: 'database_error'
      }
    }

    console.log('Vote response:', result)
    
    if (result.success) {
      toast({
        title: "Success",
        description: result.userHasVoted ? "Vote added" : "Vote removed",
      })
    }
    
    return result as RequestVoteResponse
  } catch (error) {
    // Handle network errors or other exceptions
    console.error('Vote operation failed:', error)
    
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to submit vote",
      variant: "destructive"
    })
    
    return {
      success: false,
      currentVotes: 0,
      userHasVoted: false,
      error: 'database_error'
    }
  }
}
