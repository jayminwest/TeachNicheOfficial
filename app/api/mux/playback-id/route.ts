import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

const muxClient = new Mux(
  process.env.MUX_TOKEN_ID!,
  process.env.MUX_TOKEN_SECRET!
);
const { Video } = muxClient;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  try {
    const asset = await Video.Assets.get(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;

    if (!playbackId) {
      return NextResponse.json({ error: 'No playback ID found' }, { status: 404 });
    }

    return NextResponse.json({ playbackId });
  } catch (error) {
    console.error('Error fetching Mux asset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playback ID' },
      { status: 500 }
    );
  }
}
