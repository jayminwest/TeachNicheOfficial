import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { voteSchema } from '@/app/lib/schemas/lesson-request'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
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
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

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
      .eq('user_id', session.user.id)
      .single()

    let voteResult;
    let userHasVoted = false;

    // Transaction to handle vote and update vote count
    if (existingVote) {
      // Remove the vote (toggle behavior)
      const { error: deleteError } = await supabase
        .from('lesson_request_votes')
        .delete()
        .eq('id', existingVote.id)

      if (deleteError) throw deleteError
      userHasVoted = false;
    } else {
      // Create new vote
      const { data, error } = await supabase
        .from('lesson_request_votes')
        .insert([{
          request_id: validatedData.requestId,
          user_id: session.user.id,
          vote_type: validatedData.voteType,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      voteResult = data;
      userHasVoted = true;
    }

    // Get updated vote count
    const { count, error: countError } = await supabase
      .from('lesson_request_votes')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', validatedData.requestId)

    if (countError) throw countError

    // Update the lesson_requests table with the new vote count
    const { error: updateError } = await supabase
      .from('lesson_requests')
      .update({ vote_count: count || 0 })
      .eq('id', validatedData.requestId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      currentVotes: count || 0,
      userHasVoted,
      data: voteResult || null
    })
  } catch (error) {
    console.error('Error in votes endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process vote',
        success: false,
        currentVotes: 0,
        userHasVoted: false
      },
      { status: 500 }
    )
  }
}
