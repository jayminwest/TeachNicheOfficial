import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function POST(request: Request) {
  try {
    // Make sure to await cookies()
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const { lessonId, muxAssetId, muxPlaybackId, status } = await request.json();
    
    // Validate required fields
    if (!lessonId || !muxAssetId || !muxPlaybackId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the user has permission to update this lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('creator_id')
      .eq('id', lessonId)
      .single();
    
    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    if (lesson.creator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this lesson' },
        { status: 403 }
      );
    }
    
    // Update the lesson
    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        status,
        mux_asset_id: muxAssetId,
        mux_playback_id: muxPlaybackId,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);
    
    if (updateError) {
      console.error('Error updating lesson:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lesson' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Lesson status updated to ${status}`
    });
  } catch (error) {
    console.error('Error in update-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { lessonId, muxAssetId, muxPlaybackId, status } = await request.json();
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId parameter' },
        { status: 400 }
      );
    }
    
    // Get the current user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`API: Updating lesson ${lessonId} status to ${status || 'published'}`);
    console.log(`API: Asset ID: ${muxAssetId || 'not provided'}, Playback ID: ${muxPlaybackId || 'not provided'}`);
    
    // Prepare the update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only include fields that are provided
    if (status) {
      updateData.status = status;
    }
    
    if (muxAssetId) {
      updateData.mux_asset_id = muxAssetId;
    }
    
    if (muxPlaybackId) {
      updateData.mux_playback_id = muxPlaybackId;
    }
    
    // Update the lesson
    const { data, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
      .eq('creator_id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('API: Error updating lesson status:', error);
      return NextResponse.json(
        { error: 'Failed to update lesson status', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, lesson: data });
  } catch (error) {
    console.error('API: Error updating lesson status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update lesson status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
