import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

export async function GET(request: Request) {
  // Initialize Mux client inside the request handler
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    console.error('Missing Mux credentials');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const muxClient = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET
  });

  const Video = muxClient.Video;
  console.log('Video client initialized:', !!Video);
  console.log('Video.Assets exists:', !!Video?.Assets);
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  try {
    console.log('MUX_TOKEN_ID:', process.env.MUX_TOKEN_ID?.slice(0,5) + '...');
    console.log('MUX_TOKEN_SECRET exists:', !!process.env.MUX_TOKEN_SECRET);
    if (!Video?.Assets?.createPlaybackId) {
      console.error('Mux Video client not properly initialized:', {
        videoExists: !!Video,
        assetsExists: !!Video?.Assets,
        createPlaybackIdExists: !!Video?.Assets?.createPlaybackId
      });
      throw new Error('Mux client not properly initialized');
    }

    console.log('Creating playback ID for asset:', assetId);
    
    try {
      // First check if the asset exists and is ready
      const asset = await Video.Assets.get(assetId);
      console.log('Asset status:', asset.status);
      
      if (asset.status !== 'ready') {
        return NextResponse.json(
          { error: 'Asset not ready', details: `Current status: ${asset.status}` },
          { status: 400 }
        );
      }

      // Create a new playback ID
      const playbackId = await Video.Assets.createPlaybackId(assetId, { 
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
    } catch (muxError: any) {
      console.error('Mux API error:', {
        error: muxError,
        message: muxError.message,
        type: muxError.type,
        details: muxError.details
      });
      throw muxError;
    }
  } catch (error: any) {
    console.error('Error fetching Mux asset:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: error.type,
      details: error.details || error
    });

    // Check if it's a Mux API error
    if (error.type && error.type.startsWith('mux')) {
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
