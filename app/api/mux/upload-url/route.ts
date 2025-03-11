import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Initialize Mux client
const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || '',
});

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
    
    // Create a new direct upload
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
      },
      cors_origin: '*',
    });
    
    // Return the upload URL and asset ID
    return NextResponse.json({
      uploadUrl: upload.url,
      assetId: upload.asset_id,
    });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    return NextResponse.json(
      { message: 'Failed to create upload URL', error: String(error) },
      { status: 500 }
    );
  }
}
