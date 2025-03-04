import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { waitForAssetReady } from '@/app/services/mux';

export async function POST(request: Request) {
  try {
    const { lessonId, muxAssetId } = await request.json();
    
    if (!lessonId || !muxAssetId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Poll Mux API for asset status
    const result = await waitForAssetReady(muxAssetId, {
      maxAttempts: 60,  // 10 minutes total
      interval: 10000   // 10 seconds between checks
    });
    
    if (result.status === 'ready' && result.playbackId) {
      // Update lesson with playback ID and change status to published
      const supabase = await createServerSupabaseClient();
      
      const { error } = await supabase
        .from('lessons')
        .update({ 
          status: 'published',
          mux_playback_id: result.playbackId
        })
        .eq('id', lessonId);
      
      if (error) {
        console.error('Failed to update lesson:', error);
        return NextResponse.json(
          { error: 'Failed to update lesson', details: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        playbackId: result.playbackId
      });
    } else {
      return NextResponse.json(
        { error: 'Video processing failed or timed out' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
