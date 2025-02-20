import { NextResponse } from 'next/server';
import { Video } from '@/lib/mux';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  try {
    try {
      console.log('Creating playback ID for asset:', assetId);
      // First check if the asset exists and is ready
      const asset = await Video.assets.retrieve(assetId);
      
      if (!asset || !asset.status) {
        return NextResponse.json(
          { error: 'Asset not found or invalid' },
          { status: 404 }
        );
      }
      
      console.log('Asset status:', asset.status);
      
      if (asset.status !== 'ready') {
        return NextResponse.json(
          { error: 'Asset not ready', details: `Current status: ${asset.status}` },
          { status: 400 }
        );
      }

      // Create a new playback ID
      const playbackId = await Video.assets.createPlaybackId(assetId, { 
        policy: 'public' 
      });
      
      console.log('Created playback ID:', JSON.stringify({
        assetId: assetId,
        playbackId: playbackId
      }, null, 2));

      if (!playbackId || !playbackId.id) {
        throw new Error('Failed to create playback ID');
      }

      return NextResponse.json({ playbackId: playbackId.id });
    } catch (muxError: unknown) {
      const errorDetails = {
        error: muxError,
        message: muxError instanceof Error ? muxError.message : 'Unknown error',
        type: (muxError as any)?.type,
        details: (muxError as any)?.details
      };
      console.error('Mux API error:', errorDetails);
      throw muxError;
    }
  } catch (error: unknown) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      type: (error as any)?.type,
      details: (error as any)?.details || error
    };
    console.error('Error fetching Mux asset:', errorDetails);

    // Check if it's a Mux API error
    if ((error as any)?.type?.startsWith('mux')) {
      return NextResponse.json(
        { error: `Mux API error: ${error.type}`, details: error.message },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch playback ID', details: error.message },
      { status: 500 }
    );
  }
}
