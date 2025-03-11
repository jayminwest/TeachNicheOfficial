import { NextResponse } from 'next/server';
import { getAssetStatus } from '@/app/services/mux';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json(
        { error: 'Missing assetId parameter' },
        { status: 400 }
      );
    }

    const status = await getAssetStatus(assetId);
    
    if (status.error) {
      return NextResponse.json(
        { error: status.error },
        { status: 500 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting asset status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get asset status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
