import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
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
