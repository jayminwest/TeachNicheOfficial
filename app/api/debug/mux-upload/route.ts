import { NextResponse } from 'next/server';
import { createUpload, getUploadStatus, getAssetStatus, getMuxClient, debugMuxClient } from '@/app/services/mux';
import Mux from '@mux/mux-node';

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
      NODE_ENV: process.env.NODE_ENV || 'not set',
    };
    
    // Test Mux client initialization directly
    let muxInitTest = 'Failed';
    let muxDetails = {};
    try {
      if (process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
        const testClient = new Mux({
          tokenId: process.env.MUX_TOKEN_ID,
          tokenSecret: process.env.MUX_TOKEN_SECRET
        });
        
        // Check if client was created
        if (!testClient) {
          muxInitTest = '❌ Failed to create Mux client';
        } 
        // Check if Video API is available
        else if (!testClient.Video) {
          muxInitTest = '❌ Client created but Video API not available';
          muxDetails = { client: '✅', video: '❌' };
        }
        // Check if Video.Assets is available
        else if (!testClient.Video.Assets) {
          muxInitTest = '❌ Video API available but Assets not available';
          muxDetails = { client: '✅', video: '✅', assets: '❌' };
        }
        // Check if Video.Uploads is available
        else if (!testClient.Video.Uploads) {
          muxInitTest = '❌ Video API available but Uploads not available';
          muxDetails = { client: '✅', video: '✅', assets: '✅', uploads: '❌' };
        }
        // Check if methods are functions
        else if (typeof testClient.Video.Assets.list !== 'function') {
          muxInitTest = '❌ Video API available but methods not available';
          muxDetails = { 
            client: '✅', 
            video: '✅', 
            assets: '✅', 
            uploads: '✅',
            methods: '❌'
          };
        }
        // All checks passed
        else {
          muxInitTest = '✅ Success';
          muxDetails = { 
            client: '✅', 
            video: '✅', 
            assets: '✅', 
            uploads: '✅',
            methods: '✅'
          };
        }
      } else {
        muxInitTest = '❌ Missing credentials';
      }
    } catch (error) {
      muxInitTest = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      muxDetails = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    envInfo.muxInitTest = muxInitTest;
    envInfo.muxDetails = muxDetails;

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

      case 'test-video-api':
        // Test the Video API directly
        let videoApiTest = { success: false, error: null, details: null };
        try {
          if (!muxClient || !muxClient.Video) {
            videoApiTest.error = 'Video API not available';
          } else {
            // Try to list assets as a simple test
            const assets = await muxClient.video.assets.list({ limit: 1 });
            videoApiTest = { 
              success: true, 
              error: null, 
              details: {
                hasAssets: !!assets,
                assetsCount: assets?.data?.length || 0
              }
            };
          }
        } catch (error) {
          videoApiTest = { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : null
          };
        }
        
        return NextResponse.json({
          success: true,
          message: 'Video API test results',
          videoApiTest,
          env: envInfo
        });
        
      case 'debug-video-api':
        // Get detailed debug info about the Video API
        const debugInfo = debugMuxClient();
        
        return NextResponse.json({
          success: true,
          message: 'Mux Video API Debug Info',
          debugInfo,
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
            testVideoApi: '/api/debug/mux-upload?action=test-video-api',
            debugVideoApi: '/api/debug/mux-upload?action=debug-video-api'
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
