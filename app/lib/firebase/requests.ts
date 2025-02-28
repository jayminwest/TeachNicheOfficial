import { firestore } from '@/app/services/firebase';
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
    const { category, sortBy = 'popular', status = 'open', limit = 50 } = options;
    
    let query = firestore.collection('requests');
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Apply sorting
    if (sortBy === 'popular') {
      query = query.orderBy('vote_count', 'desc');
    } else if (sortBy === 'newest') {
      query = query.orderBy('created_at', 'desc');
    }
    
    // Apply limit
    query = query.limit(limit);
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LessonRequest[];
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
}

export async function createRequest(data: LessonRequestFormData): Promise<{ id: string }> {
  try {
    const requestRef = firestore.collection('requests').doc();
    
    await requestRef.set({
      ...data,
      created_at: new Date().toISOString(),
      status: 'open',
      vote_count: 0,
      user_id: 'current-user-id' // This would be replaced with actual user ID in production
    });
    
    return { id: requestRef.id };
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
}

export async function updateRequest(id: string, data: Partial<LessonRequestFormData>): Promise<{ id: string }> {
  try {
    const requestRef = firestore.collection('requests').doc(id);
    
    await requestRef.update({
      ...data,
      updated_at: new Date().toISOString()
    });
    
    return { id };
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
}

export async function deleteRequest(id: string): Promise<boolean> {
  try {
    await firestore.collection('requests').doc(id).delete();
    return true;
  } catch (error) {
    console.error('Error deleting request:', error);
    return false;
  }
}

export async function voteForRequest(requestId: string, userId: string): Promise<void> {
  try {
    // Check if user already voted
    const voteRef = firestore.collection('votes').doc(`${requestId}_${userId}`);
    const voteDoc = await voteRef.get();
    
    // Start a transaction
    await firestore.runTransaction(async (transaction) => {
      const requestRef = firestore.collection('requests').doc(requestId);
      
      if (voteDoc.exists) {
        // User already voted, remove the vote
        transaction.delete(voteRef);
        
        // Update vote count
        transaction.update(requestRef, {
          vote_count: firestore.FieldValue.increment(-1)
        });
      } else {
        // User hasn't voted, add the vote
        transaction.set(voteRef, {
          user_id: userId,
          request_id: requestId,
          vote_type: 'upvote',
          created_at: new Date().toISOString()
        });
        
        // Update vote count
        transaction.update(requestRef, {
          vote_count: firestore.FieldValue.increment(1)
        });
      }
    });
  } catch (error) {
    console.error('Error voting for request:', error);
    throw error;
  }
}

export async function getUserVotes(userId: string): Promise<string[]> {
  try {
    const votesSnapshot = await firestore
      .collection('votes')
      .where('user_id', '==', userId)
      .get();
    
    return votesSnapshot.docs.map(doc => doc.data().request_id);
  } catch (error) {
    console.error('Error getting user votes:', error);
    throw error;
  }
}
