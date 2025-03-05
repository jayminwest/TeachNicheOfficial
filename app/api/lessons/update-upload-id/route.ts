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
