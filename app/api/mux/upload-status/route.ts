import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import Mux from '@mux/mux-node';

// Initialize Mux client
const initMuxClient = () => {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  
  if (!tokenId || !tokenSecret) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables must be set');
  }
  
  return new Mux({
    tokenId,
    tokenSecret,
  });
};

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID required' },
        { status: 400 }
      );
    }

    // Initialize Mux client
    let muxClient;
    try {
      muxClient = initMuxClient();
    } catch (error) {
      console.error('Failed to initialize Mux client:', error);
      return NextResponse.json(
        { error: { message: 'Mux client initialization failed', type: 'api_error' } },
        { status: 500 }
      );
    }
    
    const Video = muxClient.Video;

    try {
      // Get upload status from Mux
      const upload = await Video.Uploads.get(uploadId);
      
      return NextResponse.json({
        id: upload.id,
        status: upload.status,
        assetId: upload.asset_id || null,
        error: upload.error ? { message: upload.error.message, type: upload.error.type } : null
      });
    } catch (muxError) {
      console.error('Error getting upload from Mux:', muxError);
      
      // If we can't get the upload, return a fallback response for temporary assets
      if (uploadId.startsWith('temp_')) {
        return NextResponse.json({
          id: uploadId,
          status: 'preparing',
          assetId: null
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to get upload status from Mux',
          details: muxError instanceof Error ? muxError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in upload-status route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get upload status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
