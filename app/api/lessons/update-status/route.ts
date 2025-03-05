import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

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
