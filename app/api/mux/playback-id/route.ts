import { NextResponse } from 'next/server';
import { Video } from '@/app/lib/mux';

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

      if (!Video || typeof Video.assets?.createPlaybackId !== 'function') {
        throw new Error('Mux Video client not properly initialized');
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
      interface MuxErrorType {
        type?: string;
        details?: string;
        status?: number;
      }
      
      const errorDetails = {
        error: muxError,
        message: muxError instanceof Error ? muxError.message : 'Unknown error',
        type: (muxError as MuxErrorType)?.type,
        details: (muxError as MuxErrorType)?.details
      };
      console.error('Mux API error:', errorDetails);
      throw muxError;
    }
  } catch (error: unknown) {
    interface ExtendedError {
      code?: string;
      type?: string;
      details?: string;
      status?: number;
      message?: string;
    }

    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as ExtendedError)?.code,
      type: (error as ExtendedError)?.type,
      details: (error as ExtendedError)?.details || error
    };
    console.error('Error fetching Mux asset:', errorDetails);

    // Check if it's a Mux API error
    const typedError = error as ExtendedError;
    if (typedError?.type?.startsWith('mux')) {
      return NextResponse.json(
        { 
          error: `Mux API error: ${typedError.type}`, 
          details: typedError.message || 'Unknown error'
        },
        { status: typedError.status || 500 }
      );
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch playback ID', 
        details: typedError.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
