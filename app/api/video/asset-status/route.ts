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
    const asset = await Video.assets.get(assetId);
    
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

    return NextResponse.json({ status: asset.status });
  } catch (error) {
    console.error('Error checking asset status:', error);
    return NextResponse.json({ 
      error: 'Failed to check asset status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
