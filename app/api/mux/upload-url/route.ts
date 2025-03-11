import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  try {
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
    
    // Verify environment variables are set
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      console.error('Missing Mux credentials in environment variables');
      return NextResponse.json(
        { message: 'Server configuration error: Missing Mux credentials' },
        { status: 500 }
      );
    }
    
    // Import Mux SDK using CommonJS require to avoid ESM issues
    const MuxNode = require('@mux/mux-node');
    
    // Create a new Mux instance with each request
    const muxClient = new MuxNode.default({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });
    
    // Create a new direct upload
    const upload = await muxClient.Video.Uploads.create({
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
    
    // Provide a specific error message for production
    const errorMessage = error instanceof Error 
      ? error.message
      : 'Unknown error occurred';
      
    return NextResponse.json(
      { message: 'Failed to create upload URL', error: errorMessage },
      { status: 500 }
    );
  }
}
