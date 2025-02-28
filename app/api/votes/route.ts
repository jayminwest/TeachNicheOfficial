import { NextResponse } from 'next/server'
import { voteSchema } from '@/app/lib/schemas/lesson-request'

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

    const { data, error } = await supabase
      .from('lesson_request_votes')
      .select('id, request_id, user_id, vote_type, created_at')
      .eq('request_id', requestId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching vote:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vote' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || null)
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
    const { data: { session } } = await new Promise(resolve => {
  const auth = getAuth(getApp());
  const unsubscribe = auth.onAuthStateChanged(user => {
    unsubscribe();
    resolve({ data: { session: user ? { user } : null }, error: null });
  });
})

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = voteSchema.parse(body)

    // First check if vote already exists
    const { data: existingVote } = await supabase
      .from('lesson_request_votes')
      .select('*')
      .eq('request_id', validatedData.requestId)
      .eq('user_id', user.uid)
      .single()

    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabase
        .from('lesson_request_votes')
        .update({ 
          vote_type: validatedData.voteType,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVote.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // Create new vote
    const { data, error } = await supabase
      .from('lesson_request_votes')
      .insert([{
        request_id: validatedData.requestId,
        user_id: user.uid,
        vote_type: validatedData.voteType,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in votes endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    )
  }
}
