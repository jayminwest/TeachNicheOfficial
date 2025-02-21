import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { voteSchema } from '@/lib/schemas/lesson-request'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
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

    if (existingVote) {
      // Delete existing vote if it exists
      await supabase
        .from('lesson_request_votes')
        .delete()
        .match({ id: existingVote.id })
    }

    // Insert new vote
    const { error: voteError } = await supabase
      .from('lesson_request_votes')
      .insert([{
        request_id: requestId,
        user_id: session.user.id,
        vote_type: voteType
      }])

    if (voteError) throw voteError

    // Update vote count
    const { error: updateError } = await supabase
      .rpc('update_vote_count', { request_id: requestId })

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing vote:', error)
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    )
  }
}
