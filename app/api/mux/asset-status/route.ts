import { NextResponse } from 'next/server';
import { Video } from '@/lib/mux';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
  }

  try {
    const asset = await Video.Assets.get(assetId);
    
    if (!asset || !asset.status) {
      return NextResponse.json(
        { error: 'Asset not found or invalid' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id,
      assetId: asset.id
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check asset status' }, { status: 500 });
  }
}
