import { NextResponse } from 'next/server'
import { voteSchema } from '@/app/lib/schemas/lesson-request'
import { getAuth, User } from 'firebase/auth'
import { getApp } from 'firebase/app'
import { firebaseClient } from '@/app/services/firebase-compat'

// Define the vote record type
interface VoteRecord {
  id: string;
  request_id: string;
  user_id: string;
  vote_type: string;
}

// Define a type for the query builder
type QueryBuilder = {
  eq: (field: string, value: string | boolean | number) => QueryBuilder;
  order: (field: string, options: { ascending: boolean }) => QueryBuilder;
  get: () => Promise<{ 
    data: Array<Record<string, unknown>>; 
    error: Error | null | unknown 
  }>;
};

// Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  console.log('Vote API route called');
  try {

    // Get the current user using the route handler client
    const user = await new Promise<User | null>(resolve => {
      const auth = getAuth(getApp());
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
    });
    
    if (!user || !user.uid) {
      console.log('API aborting - auth error: No user session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log('Vote request body:', body);
    const { requestId, voteType } = voteSchema.parse(body)

    // Check for existing vote
    let queryBuilder = firebaseClient
      .from('lesson_request_votes')
      .select() as unknown as QueryBuilder;
      
    // Apply filters
    queryBuilder = queryBuilder.eq('request_id', requestId);
    queryBuilder = queryBuilder.eq('user_id', user.uid);
    
    // Execute the query
    const { data: rawVotes } = await queryBuilder.get();
    // Cast the raw data to the correct type
    const existingVotes = (rawVotes || []) as unknown as VoteRecord[];
    console.log('Existing vote check:', existingVotes);

    if (existingVotes && existingVotes.length > 0) {
      console.log('Deleting existing vote');
      // Delete existing vote if it exists
      await firebaseClient
        .from('lesson_request_votes')
        .delete({ eq: ['id', existingVotes[0].id] })
    }

    // Insert new vote
    console.log('Inserting new vote');
    const { error: voteError } = await firebaseClient
      .from('lesson_request_votes')
      .insert({
        request_id: requestId,
        user_id: user.uid,
        vote_type: voteType
      })

    if (voteError) {
      console.error('Vote insert error:', voteError);
      throw voteError;
    }

    // Update vote count
    console.log('Updating vote count');
    // Since we don't have RPC in Firebase, we need to implement the vote count update directly
    let requestQueryBuilder = firebaseClient
      .from('lesson_requests')
      .select() as unknown as QueryBuilder;
      
    // Apply filter
    requestQueryBuilder = requestQueryBuilder.eq('id', requestId);
    
    // Execute the query
    const { data: requestData } = await requestQueryBuilder.get();
      
    if (requestData && requestData.length > 0) {
      // Calculate the new vote count
      let votesQueryBuilder = firebaseClient
        .from('lesson_request_votes')
        .select() as unknown as QueryBuilder;
        
      // Apply filter
      votesQueryBuilder = votesQueryBuilder.eq('request_id', requestId);
      
      // Execute the query
      const { data: votes } = await votesQueryBuilder.get();
        
      const voteCount = votes ? votes.length : 0;
      
      // Update the request with the new vote count
      const { error: updateError } = await firebaseClient
        .from('lesson_requests')
        .update({ vote_count: voteCount }, { eq: ['id', requestId] });

    if (updateError) {
      console.error('Vote count update error:', updateError);
      throw updateError;
    }

    console.log('Vote process completed successfully');
    return NextResponse.json({ success: true });
  }
  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    );
  }
}
