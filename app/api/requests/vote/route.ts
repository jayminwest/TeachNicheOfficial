import { NextResponse } from 'next/server'
import { voteSchema } from '@/app/lib/schemas/lesson-request'
import { getAuth, User } from 'firebase/auth'
import { getApp } from 'firebase/app'
import { firebaseClient } from '@/app/services/firebase-compat'

export const runtime = 'edge'

export async function POST(request: Request) {
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
      console.log('API aborting - auth error:', sessionError || 'No user session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Vote request body:', body);
    const { requestId, voteType } = voteSchema.parse(body)

    // Check for existing vote
    const { data: existingVote } = await firebaseClient
      .from('lesson_request_votes')
      .select()
      .eq('request_id', requestId)
      .eq('user_id', user.uid)
      .get()
    console.log('Existing vote check:', existingVote);

    if (existingVote) {
      console.log('Deleting existing vote');
      // Delete existing vote if it exists
      await firebaseClient
        .from('lesson_request_votes')
        .delete({ eq: ['id', existingVote.id] })
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
    const { data: request } = await firebaseClient
      .from('lesson_requests')
      .select()
      .eq('id', requestId)
      .get();
      
    if (request && request.length > 0) {
      // Calculate the new vote count
      const { data: votes } = await firebaseClient
        .from('lesson_request_votes')
        .select()
        .eq('request_id', requestId)
        .get();
        
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
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing vote:', error)
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    )
  }
}
