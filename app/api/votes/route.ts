import { NextResponse } from 'next/server'
import { voteSchema } from '@/app/lib/schemas/lesson-request'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getApp } from 'firebase/app'
import { FirestoreDatabase } from '@/app/services/database/firebase-database'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const requestId = searchParams.get('requestId')
    const userId = searchParams.get('userId')
    
    if (!requestId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Use Firebase instead of Supabase
    const db = new FirestoreDatabase()
    
    try {
      const result = await db.query('lesson_request_votes', [
        { field: 'request_id', operator: '==', value: requestId },
        { field: 'user_id', operator: '==', value: userId }
      ])
      
      const votes = result && Array.isArray(result.rows) ? result.rows : []
      const vote = votes.length > 0 ? votes[0] : null
      
      return NextResponse.json(vote)
    } catch (queryError) {
      console.error('Error fetching vote:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch vote' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in votes endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { data: { session } } = await new Promise<{ 
      data: { session: { user: { uid: string } } | null }, 
      error: null 
    }>(resolve => {
      const auth = getAuth(getApp());
      const unsubscribe = onAuthStateChanged(auth, user => {
        unsubscribe();
        resolve({ data: { session: user ? { user } : null }, error: null });
      });
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = session.user;

    const body = await request.json()
    const validatedData = voteSchema.parse(body)

    const db = new FirestoreDatabase();
    
    // First check if vote already exists
    const existingVoteResult = await db.query('lesson_request_votes', [
      { field: 'request_id', operator: '==', value: validatedData.requestId },
      { field: 'user_id', operator: '==', value: user.uid }
    ]);
    
    const existingVotes = existingVoteResult && Array.isArray(existingVoteResult.rows) ? existingVoteResult.rows : [];
    const existingVote = existingVotes.length > 0 ? existingVotes[0] : null;

    if (existingVote && 'id' in existingVote) {
      // Update existing vote
      try {
        const updatedVote = await db.update('lesson_request_votes', existingVote.id, { 
          vote_type: validatedData.voteType,
          updated_at: new Date().toISOString()
        });
        
        return NextResponse.json(updatedVote);
      } catch (updateError) {
        console.error('Error updating vote:', updateError);
        throw updateError;
      }
    }

    // Create new vote
    try {
      const newVote = await db.create('lesson_request_votes', {
        request_id: validatedData.requestId,
        user_id: user.uid,
        vote_type: validatedData.voteType,
        created_at: new Date().toISOString()
      });
      
      return NextResponse.json(newVote);
    } catch (createError) {
      console.error('Error creating vote:', createError);
      throw createError;
    }
  } catch (error) {
    console.error('Error in votes endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    )
  }
}
