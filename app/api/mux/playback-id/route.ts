import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Missing required Mux environment variables');
}

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});
const { Video } = muxClient;

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
    console.log('Asset response:', asset);
    
    const playbackId = asset.playback_ids?.[0]?.id;
    console.log('Playback ID:', playbackId);

    if (!playbackId) {
      return NextResponse.json({ error: 'No playback ID found' }, { status: 404 });
    }

    return NextResponse.json({ playbackId });
  } catch (error: any) {
    console.error('Error fetching Mux asset:', {
      message: error.message,
      stack: error.stack,
      details: error
    });
    return NextResponse.json(
      { error: 'Failed to fetch playback ID', details: error.message },
      { status: 500 }
    );
  }
}
