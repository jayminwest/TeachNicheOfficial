import { NextRequest, NextResponse } from 'next/server';
import { Mux } from '@mux/mux-node';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

// Initialize Mux client
const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || '',
});

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

    // Get the upload ID from the query parameters
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json(
        { error: { message: 'Missing uploadId parameter', type: 'validation_error' } },
        { status: 400 }
      );
    }

    console.log(`Checking asset for upload ID: ${uploadId}`);

    // First, try to get the upload to check its status
    try {
      const upload = await Video.Uploads.get(uploadId);
      
      // If the upload has an asset_id, return it
      if (upload.asset_id) {
        return NextResponse.json({
          assetId: upload.asset_id,
          status: 'ready'
        });
      }
      
      // If the upload is still in progress, return a 202 status
      if (upload.status === 'in_progress') {
        return NextResponse.json(
          { status: 'in_progress', message: 'Upload is still in progress' },
          { status: 202 }
        );
      }
      
      // If the upload is errored, return an error
      if (upload.status === 'error') {
        return NextResponse.json(
          { error: { message: 'Upload failed', type: 'upload_error' } },
          { status: 400 }
        );
      }
      
      // If the upload is completed but no asset_id, the asset might be processing
      if (upload.status === 'success') {
        // Try to list assets and find one with matching upload ID
        const assets = await Video.Assets.list({
          limit: 10,
          order_by: 'created_at:desc'
        });
        
        // Find the asset that matches this upload
        const matchingAsset = assets.find(asset => 
          asset.upload_id === uploadId
        );
        
        if (matchingAsset) {
          return NextResponse.json({
            assetId: matchingAsset.id,
            status: matchingAsset.status
          });
        }
        
        // If we can't find the asset yet, it might still be processing
        return NextResponse.json(
          { status: 'processing', message: 'Upload completed, asset is being created' },
          { status: 202 }
        );
      }
    } catch (error) {
      console.error('Error getting upload:', error);
      
      // If we can't get the upload, try to find the asset directly
      try {
        // List recent assets and try to find one with matching upload ID
        const assets = await Video.Assets.list({
          limit: 20,
          order_by: 'created_at:desc'
        });
        
        // Find the asset that matches this upload
        const matchingAsset = assets.find(asset => 
          asset.upload_id === uploadId
        );
        
        if (matchingAsset) {
          return NextResponse.json({
            assetId: matchingAsset.id,
            status: matchingAsset.status
          });
        }
      } catch (assetError) {
        console.error('Error listing assets:', assetError);
      }
    }

    // If we get here, we couldn't find an asset for this upload
    return NextResponse.json(
      { error: { message: 'No asset found for this upload', type: 'not_found' } },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in asset-by-upload route:', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unknown error', type: 'api_error' } },
      { status: 500 }
    );
  }
}
