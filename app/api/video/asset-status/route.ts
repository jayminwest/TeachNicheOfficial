import { NextResponse } from 'next/server';
import { Video } from '@/lib/mux';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');
  const isFree = searchParams.get('isFree') === 'true';

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  try {
    console.log('Fetching asset status for:', assetId);
    
    if (!Video?.assets?.get) {
      console.error('Mux Video client not properly initialized');
      return new Response(JSON.stringify({ 
        error: 'Service temporarily unavailable',
        details: 'Video service not available'
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const asset = await Video.assets.get(assetId);
    console.log('Raw asset response:', JSON.stringify(asset, null, 2));
    
    if (!asset || typeof asset !== 'object') {
      console.error('Invalid or missing asset response:', asset);
      return NextResponse.json({ 
        error: 'Invalid asset response',
        details: 'Received invalid response from Mux API'
      }, { status: 500 });
    }

    if (!asset.status) {
      console.error('Missing status in asset response:', asset);
      return NextResponse.json({ 
        error: 'Asset not found',
        details: `No asset found with ID: ${assetId}`
      }, { status: 404 });
    }
    
    if (asset.status === 'ready') {
      // Create playback ID if none exists
      if (!asset.playback_ids?.length) {
        const playbackId = await Video.assets.createPlaybackId(assetId, {
          policy: isFree ? 'public' : 'signed'
        });
        return NextResponse.json({
          status: 'ready',
          playbackId: playbackId.id
        });
      }
      
      return NextResponse.json({
        status: 'ready',
        playbackId: asset.playback_ids[0].id
      });
    }

    if (asset.status === 'errored') {
      return NextResponse.json({ 
        status: 'error',
        error: 'Video processing failed'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: asset.status,
      message: `Asset status: ${asset.status}`
    });
  } catch (error) {
    console.error('Error checking asset status:', error);
    return NextResponse.json({ 
      error: 'Failed to check asset status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
