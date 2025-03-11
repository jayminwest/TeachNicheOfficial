import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  try {
    // Verify authentication using the route handler client
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify environment variables are set
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Import Mux SDK
    const { Mux } = await import('@mux/mux-node');
    const { Video } = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });
    
    // Create a new direct upload
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
      },
      cors_origin: '*',
    });
    
    // Return the upload URL and asset ID
    // Note: The Mux Uploader component expects the URL directly, not in a property
    return NextResponse.json(upload.url);
  } catch (error) {
    console.error('Error creating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}
