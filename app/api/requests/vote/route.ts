import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { voteSchema } from '@/app/lib/schemas/lesson-request'
import type { RequestVoteResponse } from '@/app/types/request'

export const runtime = 'edge'

export async function POST(request: Request) {
  console.log('Vote API route called');
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user?.id) {
      console.log('API aborting - auth error:', sessionError || 'No user session');
      return NextResponse.json<RequestVoteResponse>(
        { 
          success: false, 
          currentVotes: 0,
          userHasVoted: false,
          error: 'unauthenticated'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Vote request body:', body);
    const { requestId, voteType } = voteSchema.parse(body)

    // Check for existing vote
    const { data: existingVote, error: checkError } = await supabase
      .from('lesson_request_votes')
      .select()
      .match({ 
        request_id: requestId,
        user_id: session.user.id 
      })
      .single()
    
    console.log('Existing vote check:', existingVote);
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected
      console.error('Error checking for existing vote:', checkError);
      return NextResponse.json<RequestVoteResponse>(
        { 
          success: false, 
          currentVotes: 0,
          userHasVoted: false,
          error: 'database_error'
        },
        { status: 500 }
      )
    }

    let currentVotes = 0;
    let userHasVoted = false;

    if (existingVote) {
      console.log('Deleting existing vote');
      // Delete existing vote if it exists
      const { error: deleteError } = await supabase
        .from('lesson_request_votes')
        .delete()
        .match({ id: existingVote.id })
      
      if (deleteError) {
        console.error('Error deleting vote:', deleteError);
        return NextResponse.json<RequestVoteResponse>(
          { 
            success: false, 
            currentVotes: 0,
            userHasVoted: true,
            error: 'database_error'
          },
          { status: 500 }
        )
      }
      
      userHasVoted = false;
    } else {
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
        // Check for unique constraint violation (race condition)
        if (voteError.code === '23505') {
          return NextResponse.json<RequestVoteResponse>(
            { 
              success: false, 
              currentVotes: 0,
              userHasVoted: true,
              error: 'already_voted'
            },
            { status: 409 }
          )
        }
        
        console.error('Vote insert error:', voteError);
        return NextResponse.json<RequestVoteResponse>(
          { 
            success: false, 
            currentVotes: 0,
            userHasVoted: false,
            error: 'database_error'
          },
          { status: 500 }
        )
      }
      
      userHasVoted = true;
    }

    // Get updated vote count
    const { count: voteCount, error: countError } = await supabase
      .from('lesson_request_votes')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', requestId);
    
    if (countError) {
      console.error('Error getting vote count:', countError);
    } else {
      currentVotes = voteCount || 0;
    }
    
    // Update the lesson_requests table vote_count
    const { error: updateError } = await supabase
      .from('lesson_requests')
      .update({ vote_count: currentVotes })
      .eq('id', requestId);

    if (updateError) {
      console.error('Vote count update error:', updateError);
      // Continue anyway since we have the correct count for the response
    }

    console.log('Vote process completed successfully');
    return NextResponse.json<RequestVoteResponse>({ 
      success: true,
      currentVotes,
      userHasVoted
    })
  } catch (error) {
    console.error('Error processing vote:', error)
    return NextResponse.json<RequestVoteResponse>(
      { 
        success: false, 
        currentVotes: 0,
        userHasVoted: false,
        error: 'database_error'
      },
      { status: 500 }
    )
  }
}
