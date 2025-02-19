import { NextResponse } from 'next/server';
import { Video } from '@/lib/mux';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
  }

  try {
    console.log('Fetching asset status for:', assetId);
    
    const asset = await Video.assets.get(assetId);
    console.log('Mux asset response:', JSON.stringify(asset, null, 2));
    
    if (!asset || !asset.status) {
      console.error('Invalid asset response:', asset);
      return NextResponse.json(
        { error: 'Asset not found or invalid' },
        { status: 404 }
      );
    }
    
    const response = {
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id,
      assetId: asset.id
    };
    
    console.log('Returning asset status:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking asset status:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Failed to check asset status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
