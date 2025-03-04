import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Get the temporary asset ID from the query parameters
    const { searchParams } = new URL(request.url);
    const tempAssetId = searchParams.get('assetId');

    if (!tempAssetId) {
      return NextResponse.json(
        { error: { message: 'Missing assetId parameter', type: 'validation_error' } },
        { status: 400 }
      );
    }

    // Check if this is a temporary asset ID
    if (!tempAssetId.startsWith('temp_')) {
      return NextResponse.json(
        { error: { message: 'Not a temporary asset ID', type: 'validation_error' } },
        { status: 400 }
      );
    }

    // For temporary assets, we'll return a placeholder response
    // This will be replaced with real data once the asset is created
    const uploadId = tempAssetId.substring(5); // Remove 'temp_' prefix
    
    return NextResponse.json({
      assetId: tempAssetId,
      playbackId: `temp_playback_${uploadId}`,
      status: 'preparing',
      isTemporary: true,
      uploadId: uploadId
    });
  } catch (error) {
    console.error('Error in temp-asset route:', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unknown error', type: 'api_error' } },
      { status: 500 }
    );
  }
}
