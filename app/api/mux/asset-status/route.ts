import { NextResponse } from 'next/server';
import { Video } from '@/app/services/mux';

export async function GET(request: Request) {
  if (!Video || typeof Video.assets?.retrieve !== 'function') {
    return NextResponse.json(
      { error: 'Mux Video client not properly initialized' },
      { status: 500 }
    );
  }
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
  }

  try {
    console.log('Fetching asset status for:', assetId);
    
    console.log('Calling Mux API to get asset:', assetId);
    const asset = await Video.assets.retrieve(assetId);
    
    if (!asset) {
      console.error('Mux returned null or undefined asset');
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    console.log('Mux asset response:', JSON.stringify(asset, null, 2));
    
    if (!asset.status) {
      console.error('Invalid asset response:', asset);
      return NextResponse.json(
        { error: 'Asset status not available' },
        { status: 400 }
      );
    }

    // Check if the asset has any errors
    if (asset.errors && Object.keys(asset.errors).length > 0) {
      const errorMessage = Object.values(asset.errors).map(e => e.message).join(', ');
      return NextResponse.json(
        { 
          status: 'errored',
          error: errorMessage
        },
        { status: 200 }
      );
    }
    
    const response = {
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id,
      assetId: asset.id
    };
  
    console.log('Returning asset status:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking asset status:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Failed to check asset status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
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
