import { NextResponse } from 'next/server';
import Mux from "@mux/mux-node";

// Initialize Mux client with environment variables
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
});
const { video } = muxClient;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID required' },
        { status: 400 }
      );
    }

    console.log('Checking asset status for:', assetId);
    
    // Validate that this is an asset ID, not an upload ID
    if (!assetId.match(/^[a-zA-Z0-9]{20,}$/)) {
      return NextResponse.json(
        { error: 'Invalid asset ID format' },
        { status: 400 }
      );
    }

    const asset = await video.assets.retrieve(assetId);
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    console.log('Asset status response:', {
      id: asset.id,
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id
    });

    return NextResponse.json({
      id: asset.id,
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id,
      duration: asset.duration,
      aspectRatio: asset.aspect_ratio
    });

  } catch (error) {
    console.error('Error checking asset status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check asset status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
