import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: Request) {
  // Verify authentication
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get asset ID from query params
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    
    if (!assetId) {
      return NextResponse.json({ error: 'Missing assetId parameter' }, { status: 400 });
    }
    
    // Verify environment variables are set
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Import Mux SDK
    const Mux = await import('@mux/mux-node');
    const muxClient = new Mux.default({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });
    
    // Access the Video API (note: using lowercase 'video' and 'assets' as per Mux SDK v9.0.1)
    const asset = await muxClient.video.assets.retrieve(assetId);
    
    // Asset details already retrieved above
    
    // Return asset status and playback ID if available
    return NextResponse.json({
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id || null,
    });
  } catch (error) {
    console.error('Error checking asset status:', error);
    return NextResponse.json({ error: 'Failed to get asset status' }, { status: 500 });
  }
}
