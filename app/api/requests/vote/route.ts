import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { voteSchema } from '@/lib/schemas/lesson-request'

export const runtime = 'edge'

export async function POST(request: Request) {
  console.log('Vote API route called');
  try {

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user?.id) {
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
