import { firebaseClient } from '@/app/services/firebase-compat';
import { LessonRequest, LessonRequestFormData } from '@/app/lib/schemas/lesson-request';

export async function getRequests({ 
  category, 
  sortBy = 'popular',
  status = 'open',
  limit = 50 
}: { 
  category?: string; 
  sortBy?: 'popular' | 'newest';
  status?: 'open' | 'in_progress' | 'completed';
  limit?: number;
}): Promise<LessonRequest[]> {
  try {
    let query = firebaseClient
      .from('lesson_requests')
      .select();
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply sorting
    if (sortBy === 'popular') {
      query = query.orderBy('vote_count', 'desc');
    } else if (sortBy === 'newest') {
      query = query.orderBy('created_at', 'desc');
    }
    
    // Apply limit
    query = query.limit(limit);
    
    const { data } = await query.get();
    return data as LessonRequest[];
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
}

export async function createRequest(data: LessonRequestFormData): Promise<LessonRequest> {
  try {
    const requestData = {
      ...data,
      id: crypto.randomUUID(),
      vote_count: 0,
      status: 'open',
      created_at: new Date().toISOString()
    };
    
    const { data: newRequest, error } = await firebaseClient
      .from('lesson_requests')
      .insert(requestData);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return newRequest as LessonRequest;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
}

export async function updateRequest(id: string, data: Partial<LessonRequestFormData>): Promise<LessonRequest> {
  try {
    const { data: updatedRequest, error } = await firebaseClient
      .from('lesson_requests')
      .update(id, data);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return updatedRequest as LessonRequest;
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
}

export async function deleteRequest(id: string): Promise<void> {
  try {
    const { error } = await firebaseClient
      .from('lesson_requests')
      .delete(id);
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
}

export async function voteForRequest(requestId: string, userId: string): Promise<void> {
  try {
    // First check if the user has already voted
    const { data: existingVotes } = await firebaseClient
      .from('votes')
      .select()
      .eq('request_id', requestId)
      .eq('user_id', userId)
      .get();
    
    if (existingVotes && existingVotes.length > 0) {
      // User already voted, remove the vote
      await firebaseClient
        .from('votes')
        .delete(existingVotes[0].id);
      
      // Decrement vote count
      await firebaseClient
        .from('lesson_requests')
        .update(requestId, {
          vote_count: firebaseClient.increment(-1)
        });
    } else {
      // User hasn't voted, add a vote
      await firebaseClient
        .from('votes')
        .insert({
          id: crypto.randomUUID(),
          request_id: requestId,
          user_id: userId,
          created_at: new Date().toISOString()
        });
      
      // Increment vote count
      await firebaseClient
        .from('lesson_requests')
        .update(requestId, {
          vote_count: firebaseClient.increment(1)
        });
    }
  } catch (error) {
    console.error('Error voting for request:', error);
    throw error;
  }
}

export async function getUserVotes(userId: string): Promise<string[]> {
  try {
    const { data: votes } = await firebaseClient
      .from('votes')
      .select()
      .eq('user_id', userId)
      .get();
    
    return votes ? votes.map(vote => vote.request_id) : [];
  } catch (error) {
    console.error('Error getting user votes:', error);
    throw error;
  }
}
