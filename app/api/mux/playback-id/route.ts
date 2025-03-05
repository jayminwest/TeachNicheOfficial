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
import { NextResponse } from 'next/server';
import { Video } from '@mux/mux-node';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // Authenticate the request using Supabase
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', type: 'auth_error' } },
        { status: 401 }
      );
    }

    if (!Video || typeof Video.assets?.retrieve !== 'function') {
      return NextResponse.json(
        { error: 'Mux Video client not properly initialized' },
        { status: 500 }
      );
    }

    // Parse the URL and get the assetId parameter
    const url = new URL(request.url);
    const assetId = url.searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID required' },
        { status: 400 }
      );
    }

    // Retrieve the asset from Mux
    const asset = await Video.assets.retrieve(assetId);
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Get the playback ID
    const playbackId = asset.playback_ids?.[0]?.id || null;

    if (!playbackId) {
      return NextResponse.json(
        { error: 'No playback ID found for this asset' },
        { status: 404 }
      );
    }

    return NextResponse.json({ playbackId });
  } catch (error) {
    console.error('Error retrieving playback ID:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve playback ID',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
