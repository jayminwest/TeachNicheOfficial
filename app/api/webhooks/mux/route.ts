import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    const type = body.type;
    
    console.log(`Received Mux webhook: ${type}`);
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });
    
    // Handle video.asset.ready event
    if (type === 'video.asset.ready') {
      const assetId = body.data.id;
      const playbackId = body.data.playback_ids?.[0]?.id;
      
      if (!playbackId) {
        console.error('No playback ID found in asset.ready event');
        return NextResponse.json({ error: 'No playback ID found' }, { status: 400 });
      }
      
      console.log(`Asset ${assetId} is ready with playback ID ${playbackId}`);
      
      // Update the lesson with the playback ID
      const { error } = await supabase
        .from('lessons')
        .update({ 
          mux_playback_id: playbackId,
          status: 'published'
        })
        .eq('mux_asset_id', assetId);
      
      if (error) {
        console.error('Error updating lesson with playback ID:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
