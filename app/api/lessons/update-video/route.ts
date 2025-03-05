import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { lessonId, muxAssetId } = await request.json();
    
    if (!lessonId || !muxAssetId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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
    
    // Update the lesson with the asset ID
    const { data, error } = await supabase
      .from('lessons')
      .update({
        mux_asset_id: muxAssetId,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .eq('creator_id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating lesson:', error);
      return NextResponse.json(
        { error: 'Failed to update lesson', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, lesson: data });
  } catch (error) {
    console.error('Error updating lesson video:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update lesson video',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
