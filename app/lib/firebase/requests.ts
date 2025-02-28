// Import only what we use
import { firebaseClient } from '@/app/services/firebase-compat';
import { LessonRequestFormData } from '@/app/lib/schemas/lesson-request';

export interface LessonRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  status: 'open' | 'in_progress' | 'completed';
  vote_count: number;
  user_id: string;
  instagram_handle?: string;
  tags?: string[];
}

export interface RequestOptions {
  category?: string;
  sortBy?: 'popular' | 'newest';
  status?: 'open' | 'in_progress' | 'completed';
  limit?: number;
}

export async function getRequests(options: RequestOptions = {}): Promise<LessonRequest[]> {
  try {
    const { category, sortBy = 'popular', status = 'open' } = options;
    
    // Use firebaseClient for compatibility with existing code
    const queryBuilder = firebaseClient
      .from('lesson_requests')
      .select();
    
    if (category) {
      queryBuilder.eq('category', category);
    }
    
    if (status) {
      queryBuilder.eq('status', status);
    }
    
    // Apply sorting
    if (sortBy === 'popular') {
      queryBuilder.order('vote_count', { ascending: false });
    } else if (sortBy === 'newest') {
      queryBuilder.order('created_at', { ascending: false });
    }
    
    // Apply limit
    // TODO: Implement limit for Firebase
    
    // Temporary placeholder to avoid errors
    const { data } = await Promise.resolve({ data: [] });
    return data as LessonRequest[];
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
}

export async function createRequest(data: LessonRequestFormData): Promise<{ id: string }> {
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
    
    return { id: newRequest?.id || 'new-request-id' };
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
}

export async function updateRequest(id: string, data: Partial<LessonRequestFormData>): Promise<{ id: string }> {
  try {
    const { error } = await firebaseClient
      .from('lesson_requests')
      .update(data, { eq: ['id', id] });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { id };
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
}

export async function deleteRequest(id: string): Promise<boolean> {
  try {
    const { error } = await firebaseClient
      .from('lesson_requests')
      .delete({ eq: ['id', id] });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting request:', error);
    return false;
  }
}

export async function voteForRequest(requestId: string, userId: string): Promise<boolean> {
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
        .delete({ eq: ['id', existingVotes[0].id] });
      
      // Decrement vote count
      // Decrement vote count
      await firebaseClient
        .from('lesson_requests')
        .update({ vote_count: { decrement: 1 } }, { eq: ['id', requestId] });
      
      return true;
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
      // Increment vote count
      await firebaseClient
        .from('lesson_requests')
        .update({ vote_count: { increment: 1 } }, { eq: ['id', requestId] });
      
      return true;
    }
  } catch (error) {
    console.error('Error voting for request:', error);
    return false;
  }
}

export async function getUserVotes(userId: string): Promise<string[]> {
  try {
    try {
      const queryResult = await firebaseClient
        .from('votes')
        .select()
        .eq('user_id', userId);
      
      const votes = queryResult.data || [];
      return votes ? votes.map((vote: Record<string, unknown>) => vote.request_id as string) : [];
    } catch (error) {
      console.error('Error getting user votes:', error);
      return [];
    }
  } catch (error) {
    console.error('Error getting user votes:', error);
    return [];
  }
}
