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
    
    // In Next.js 15+, we need to use the params object directly
    const { error } = await supabase
      .from('lessons')
      .update({ mux_playback_id: playbackId })
      .eq('id', params.id);

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
