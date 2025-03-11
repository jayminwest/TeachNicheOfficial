import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Initialize Mux client
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || '',
});
const { Video } = muxClient;

export async function GET() {
  try {
    // Check if Mux is properly initialized
    if (!Video || !Video.Uploads) {
      console.error('Mux Video client not properly initialized');
      console.log('MUX_TOKEN_ID exists:', !!process.env.MUX_TOKEN_ID);
      console.log('MUX_TOKEN_SECRET exists:', !!process.env.MUX_TOKEN_SECRET);
      return NextResponse.json(
        { message: 'Mux client configuration error' },
        { status: 500 }
      );
    }

    // Verify authentication using the route handler client
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { message: 'Authentication error', error: authError.message },
        { status: 401 }
      );
    }
    
    if (!session) {
      console.error('No active session found');
      return NextResponse.json(
        { message: 'Unauthorized - No active session' },
        { status: 401 }
      );
    }
    
    console.log('Creating Mux upload with user ID:', session.user.id);
    
    // Create a new direct upload
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
      },
      cors_origin: '*',
    });
    
    console.log('Mux upload created successfully:', upload.id);
    
    // Return the upload URL and asset ID
    return NextResponse.json({
      uploadUrl: upload.url,
      assetId: upload.asset_id,
    });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    // Include stack trace for better debugging
    const errorMessage = error instanceof Error 
      ? `${error.message}\n${error.stack}` 
      : String(error);
      
    return NextResponse.json(
      { message: 'Failed to create upload URL', error: errorMessage },
      { status: 500 }
    );
  }
}
