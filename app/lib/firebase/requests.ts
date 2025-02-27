import { auth, firestore } from '@/app/lib/firebase';
import { LessonRequestStatus } from '@/types/lesson';

/**
 * Create a new lesson request
 */
export async function createRequest(data: {
  title: string;
  description: string;
  status?: LessonRequestStatus;
}) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be logged in to create a request');
    }

    const requestData = {
      ...data,
      user_id: user.uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: data.status || 'open',
      votes: 0,
    };

    const docRef = await firestore.collection('lesson_requests').add(requestData);
    return {
      data: { id: docRef.id, ...requestData },
      error: null,
    };
  } catch (error) {
    console.error('Error creating request:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get lesson requests with optional filters
 */
export async function getRequests(options: {
  userId?: string;
  status?: LessonRequestStatus;
  limit?: number;
  offset?: number;
} = {}) {
  try {
    let query = firestore.collection('lesson_requests');

    if (options.userId) {
      query = query.where('user_id', '==', options.userId);
    }

    if (options.status) {
      query = query.where('status', '==', options.status);
    }

    // Order by votes (descending) and then by created_at (descending)
    query = query.orderBy('votes', 'desc').orderBy('created_at', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Firestore doesn't support offset directly, so we need to use startAfter
    // This is a simplified implementation - in a real app, you'd need to handle pagination tokens
    if (options.offset && options.offset > 0) {
      // This is a placeholder - in a real implementation, you'd need to fetch the document at position offset-1
      // and use it as a starting point
      console.warn('Offset is not fully implemented in Firebase getRequests');
    }

    const snapshot = await query.get();
    const requests = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));

    return {
      data: requests,
      error: null,
    };
  } catch (error) {
    console.error('Error getting requests:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Update a lesson request
 */
export async function updateRequest(
  requestId: string,
  data: Partial<{
    title: string;
    description: string;
    status: LessonRequestStatus;
  }>
) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be logged in to update a request');
    }

    // First check if the user owns this request or is an admin
    const requestDoc = await firestore.collection('lesson_requests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      throw new Error('Request not found');
    }
    
    const requestData = requestDoc.data();
    if (requestData?.user_id !== user.uid) {
      // Check if user is admin (you'd need to implement this check)
      const isAdmin = false; // Placeholder - implement proper admin check
      if (!isAdmin) {
        throw new Error('You do not have permission to update this request');
      }
    }

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    await firestore.collection('lesson_requests').doc(requestId).update(updateData);
    
    return {
      data: { id: requestId, ...requestData, ...updateData },
      error: null,
    };
  } catch (error) {
    console.error('Error updating request:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete a lesson request
 */
export async function deleteRequest(requestId: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be logged in to delete a request');
    }

    // First check if the user owns this request or is an admin
    const requestDoc = await firestore.collection('lesson_requests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      throw new Error('Request not found');
    }
    
    const requestData = requestDoc.data();
    if (requestData?.user_id !== user.uid) {
      // Check if user is admin (you'd need to implement this check)
      const isAdmin = false; // Placeholder - implement proper admin check
      if (!isAdmin) {
        throw new Error('You do not have permission to delete this request');
      }
    }

    await firestore.collection('lesson_requests').doc(requestId).delete();
    
    return {
      data: { id: requestId },
      error: null,
    };
  } catch (error) {
    console.error('Error deleting request:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Vote for a lesson request
 */
export async function voteForRequest(requestId: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be logged in to vote for a request');
    }

    // Start a transaction to ensure vote integrity
    await firestore.runTransaction(async (transaction) => {
      // Check if user has already voted
      const voteRef = firestore.collection('request_votes').doc(`${requestId}_${user.uid}`);
      const voteDoc = await transaction.get(voteRef);
      
      if (voteDoc.exists) {
        throw new Error('You have already voted for this request');
      }
      
      // Get the request
      const requestRef = firestore.collection('lesson_requests').doc(requestId);
      const requestDoc = await transaction.get(requestRef);
      
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }
      
      // Create the vote record
      transaction.set(voteRef, {
        user_id: user.uid,
        request_id: requestId,
        created_at: new Date().toISOString(),
      });
      
      // Increment the vote count
      const currentVotes = requestDoc.data()?.votes || 0;
      transaction.update(requestRef, { votes: currentVotes + 1 });
    });
    
    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    console.error('Error voting for request:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
