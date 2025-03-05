import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { lessonId, muxUploadId } = await request.json();
    
    if (!lessonId || !muxUploadId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Update the lesson with the upload ID
    const { error } = await supabase
      .from('lessons')
      .update({ 
        mux_upload_id: muxUploadId,
        status: 'uploading'
      })
      .eq('id', lessonId);
    
    if (error) {
      console.error('Error updating lesson with upload ID:', error);
      return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lesson with upload ID:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { lessonId, muxUploadId } = await request.json();
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId parameter' },
        { status: 400 }
      );
    }
    
    if (!muxUploadId) {
      return NextResponse.json(
        { error: 'Missing muxUploadId parameter' },
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
    
    console.log(`API: Updating lesson ${lessonId} with upload ID ${muxUploadId}`);
    
    // Update the lesson with the upload ID
    const { data, error } = await supabase
      .from('lessons')
      .update({
        mux_upload_id: muxUploadId,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .eq('creator_id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('API: Error updating lesson:', error);
      return NextResponse.json(
        { error: 'Failed to update lesson', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, lesson: data });
  } catch (error) {
    console.error('API: Error updating lesson upload ID:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update lesson upload ID',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
