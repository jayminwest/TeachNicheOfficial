import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

console.log('Starting Mux client initialization...');

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Missing required Mux environment variables');
}

// Initialize Mux client
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

const Video = muxClient.Video;
console.log('Video client initialized:', !!Video);
console.log('Video.Assets exists:', !!Video?.Assets);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  try {
    console.log('MUX_TOKEN_ID:', process.env.MUX_TOKEN_ID?.slice(0,5) + '...');
    console.log('MUX_TOKEN_SECRET exists:', !!process.env.MUX_TOKEN_SECRET);
    console.log('Fetching asset:', assetId);
    
    const asset = await Video.Assets.get(assetId);
    console.log('Asset response:', JSON.stringify({
      id: asset.id,
      status: asset.status,
      playback_ids: asset.playback_ids,
      created_at: asset.created_at,
      duration: asset.duration
    }, null, 2));

    // Create a new playback ID if one doesn't exist
    if (!asset.playback_ids || asset.playback_ids.length === 0) {
      console.log('No playback IDs found, creating one...');
      const updatedAsset = await Video.Assets.createPlaybackId(assetId, { policy: 'public' });
      const playbackId = updatedAsset.playback_ids[0]?.id;
      if (!playbackId) {
        throw new Error('Failed to create playback ID');
      }
      return NextResponse.json({ playbackId });
    }
    
    const playbackId = asset.playback_ids[0]?.id;
    console.log('Playback ID:', playbackId);

    if (!playbackId) {
      return NextResponse.json({ error: 'No playback ID found' }, { status: 404 });
    }

    return NextResponse.json({ playbackId });
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
