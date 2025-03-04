import { NextResponse } from 'next/server';
import { createUpload, getUploadStatus, getAssetStatus } from '@/app/services/mux';

/**
 * Debug endpoint for testing Mux video uploads
 * This route provides a simple way to test the Mux integration
 * without going through the full lesson creation flow
 * 
 * Only available in development environment
 */
export async function GET(request: Request) {
  // Check if we're in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      success: false,
      message: 'Debug endpoints are only available in development environment'
    }, { status: 403 });
  }
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'info';
  const uploadId = url.searchParams.get('uploadId');
  const assetId = url.searchParams.get('assetId');
  const isFree = url.searchParams.get('isFree') === 'true';

  try {
    // Check environment variables
    const envInfo = {
      MUX_TOKEN_ID: process.env.MUX_TOKEN_ID ? '✅ Set' : '❌ Missing',
      MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET ? '✅ Set' : '❌ Missing',
      MUX_SIGNING_KEY_ID: process.env.MUX_SIGNING_KEY_ID ? '✅ Set' : '❌ Missing',
      MUX_SIGNING_KEY: process.env.MUX_SIGNING_KEY ? '✅ Set (length: ' + process.env.MUX_SIGNING_KEY.length + ')' : '❌ Missing',
    };

    // Handle different actions
    switch (action) {
      case 'create-upload':
        // Create a new upload URL
        const upload = await createUpload(isFree);
        return NextResponse.json({
          success: true,
          message: 'Upload URL created successfully',
          data: upload,
          env: envInfo
        });

      case 'upload-status':
        // Check upload status
        if (!uploadId) {
          return NextResponse.json({
            success: false,
            message: 'Missing uploadId parameter',
            env: envInfo
          }, { status: 400 });
        }
        
        const uploadStatus = await getUploadStatus(uploadId);
        return NextResponse.json({
          success: true,
          message: 'Upload status retrieved',
          data: uploadStatus,
          env: envInfo
        });

      case 'asset-status':
        // Check asset status
        if (!assetId) {
          return NextResponse.json({
            success: false,
            message: 'Missing assetId parameter',
            env: envInfo
          }, { status: 400 });
        }
        
        const assetStatus = await getAssetStatus(assetId);
        return NextResponse.json({
          success: true,
          message: 'Asset status retrieved',
          data: assetStatus,
          env: envInfo
        });

      case 'info':
      default:
        // Return environment info and usage instructions
        return NextResponse.json({
          success: true,
          message: 'Mux Debug API',
          env: envInfo,
          usage: {
            createUpload: '/api/debug/mux-upload?action=create-upload&isFree=true',
            uploadStatus: '/api/debug/mux-upload?action=upload-status&uploadId=YOUR_UPLOAD_ID',
            assetStatus: '/api/debug/mux-upload?action=asset-status&assetId=YOUR_ASSET_ID',
          }
        });
    }
  } catch (error) {
    console.error('Mux debug API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error in Mux debug API',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
