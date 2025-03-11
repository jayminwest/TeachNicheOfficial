import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: Request) {
  // Verify authentication
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - No active session' },
      { status: 401 }
    );
  }
  
  try {
    // Get asset ID from query params
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    
    if (!assetId) {
      return NextResponse.json(
        { error: 'Missing assetId parameter' },
        { status: 400 }
      );
    }
    
    // Import Mux dynamically to avoid initialization issues
    const Mux = (await import('@mux/mux-node')).default;
    
    // Create a new Mux instance with each request
    const muxClient = new Mux({
      tokenId: process.env.MUX_TOKEN_ID || '',
      tokenSecret: process.env.MUX_TOKEN_SECRET || '',
    });
    
    // Get asset details from Mux
    const asset = await muxClient.Video.Assets.get(assetId);
    
    // Return asset status and playback ID if available
    return NextResponse.json({
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id || null,
    });
  } catch (error) {
    console.error('Error checking asset status:', error);
    return NextResponse.json(
      { error: 'Failed to get asset status', details: String(error) },
      { status: 500 }
    );
  }
}
