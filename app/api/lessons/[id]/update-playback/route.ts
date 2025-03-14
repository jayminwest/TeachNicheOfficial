import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

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
    
    // Use the route handler client to maintain the user's session
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Await the params object before accessing its properties
    const { id } = await params;
    
    const { error } = await supabase
      .from('lessons')
      .update({ mux_playback_id: playbackId })
      .eq('id', id);

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
