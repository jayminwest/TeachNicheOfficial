import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { voteSchema } from '@/app/lib/schemas/lesson-request'
import { Database } from '@/app/types/database'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
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
    console.log('Votes POST request received');
    
    const supabase = createRouteHandlerClient<Database>({ cookies })
    console.log('Supabase client created');
    
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Auth session retrieved:', session ? 'Session exists' : 'No session');

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body);
    
    let validatedData;
    try {
      validatedData = voteSchema.parse(body)
      console.log('Data validated successfully:', validatedData);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationError instanceof Error ? validationError.message : 'Unknown validation error',
          success: false
        },
        { status: 400 }
      )
    }

    // First check if vote already exists
    console.log('Checking for existing vote');
    const { data: existingVote, error: existingVoteError } = await supabase
      .from('lesson_request_votes')
      .select('*')
      .eq('request_id', validatedData.requestId)
      .eq('user_id', session.user.id)
      .single()
    
    if (existingVoteError && existingVoteError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error checking for existing vote:', existingVoteError);
      throw existingVoteError;
    }

    let voteResult;
    let userHasVoted = false;
    console.log('Existing vote:', existingVote ? 'Found' : 'Not found');

    // Transaction to handle vote and update vote count
    if (existingVote) {
      console.log('Removing existing vote with ID:', existingVote.id);
      // Remove the vote (toggle behavior)
      const { error: deleteError } = await supabase
        .from('lesson_request_votes')
        .delete()
        .eq('id', existingVote.id)

      if (deleteError) {
        console.error('Error deleting vote:', deleteError);
        throw deleteError;
      }
      console.log('Vote deleted successfully');
      userHasVoted = false;
    } else {
      // Create new vote
      console.log('Creating new vote');
      const voteData = {
        request_id: validatedData.requestId,
        user_id: session.user.id,
        vote_type: validatedData.voteType,
        created_at: new Date().toISOString()
      };
      console.log('Vote data:', voteData);
      
      const { data, error } = await supabase
        .from('lesson_request_votes')
        .insert([voteData])
        .select()
        .single()

      if (error) {
        console.error('Error inserting vote:', error);
        throw error;
      }
      console.log('Vote created successfully:', data);
      voteResult = data;
      userHasVoted = true;
    }

    // Get updated vote count
    console.log('Getting updated vote count');
    const { count, error: countError } = await supabase
      .from('lesson_request_votes')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', validatedData.requestId)

    if (countError) {
      console.error('Error getting vote count:', countError);
      throw countError;
    }
    console.log('Updated vote count:', count);

    // Update the lesson_requests table with the new vote count
    console.log('Updating lesson_requests with new vote count:', count || 0);
    try {
      const { error: updateError } = await supabase
        .from('lesson_requests')
        .update({ vote_count: count || 0 })
        .eq('id', validatedData.requestId)

      if (updateError) {
        console.error('Error updating lesson request vote count:', updateError);
        throw updateError;
      }
      console.log('Vote count updated successfully');
    } catch (updateErr) {
      console.error('Exception during vote count update:', updateErr);
      // Don't throw here - we'll still return a success response with the current vote count
      // This way, even if the update fails, the vote itself was processed
    }

    return NextResponse.json({
      success: true,
      currentVotes: count || 0,
      userHasVoted,
      data: voteResult || null
    })
  } catch (error) {
    // Log detailed error information
    console.error('Error in votes endpoint:', error)
    
    // Create a more detailed error response
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : 'Unknown error';
    
    // Return a more informative error response
    return NextResponse.json(
      { 
        error: `Failed to process vote: ${errorMessage}`,
        details: error instanceof Error ? error.stack : undefined,
        success: false,
        currentVotes: 0,
        userHasVoted: false
      },
      { status: 500 }
    )
  }
}
