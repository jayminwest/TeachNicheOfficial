import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { playbackId } = await request.json();
    
    if (!playbackId) {
      return NextResponse.json(
        { error: 'Playback ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createServerSupabaseClient();
    
    // Extract the ID from params and use it after all async operations
    const { id: lessonId } = params;
    
    const { error } = await supabase
      .from('lessons')
      .update({ mux_playback_id: playbackId })
      .eq('id', lessonId);

    if (error) {
      console.error('Error updating playback ID:', error);
      return NextResponse.json(
        { error: 'Error updating playback ID' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
