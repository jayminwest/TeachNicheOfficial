import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { voteSchema } from '@/lib/schemas/lesson-request'

export const runtime = 'edge'

export async function POST(request: Request) {
  console.log('Vote API route called');
  try {
    // Get auth token from request header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get session with full error handling
    const sessionResponse = await supabase.auth.getSession()
    
    if (sessionResponse.error) {
      console.log('API aborting - session error:', sessionResponse.error);
      return NextResponse.json(
        { error: 'Session error: ' + sessionResponse.error.message },
        { status: 401 }
      )
    }

    const session = sessionResponse.data.session
    if (!session?.user?.id) {
      console.log('API aborting - no valid session user');
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }

    // Verify the session is still valid
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('API aborting - invalid user:', userError);
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Vote request body:', body);
    const { requestId, voteType } = voteSchema.parse(body)

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from('lesson_request_votes')
      .select()
      .match({ 
        request_id: requestId,
        user_id: session.user.id 
      })
      .single()
    console.log('Existing vote check:', existingVote);

    if (existingVote) {
      console.log('Deleting existing vote');
      // Delete existing vote if it exists
      await supabase
        .from('lesson_request_votes')
        .delete()
        .match({ id: existingVote.id })
    }

    // Insert new vote
    console.log('Inserting new vote');
    const { error: voteError } = await supabase
      .from('lesson_request_votes')
      .insert([{
        request_id: requestId,
        user_id: session.user.id,
        vote_type: voteType
      }])

    if (voteError) {
      console.error('Vote insert error:', voteError);
      throw voteError;
    }

    // Update vote count
    console.log('Updating vote count');
    const { error: updateError } = await supabase
      .rpc('update_vote_count', { request_id: requestId })

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
