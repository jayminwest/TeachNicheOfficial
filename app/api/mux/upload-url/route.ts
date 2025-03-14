import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Mux from '@mux/mux-node';

export async function GET() {
  try {
    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Mux client
    const muxClient = new Mux({
      tokenId: process.env.MUX_TOKEN_ID || '',
      tokenSecret: process.env.MUX_TOKEN_SECRET || '',
    });
    
    // Create a direct upload with public playback policy
    const upload = await muxClient.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
      },
      cors_origin: '*',
    });
    
    return NextResponse.json({ url: upload.url });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}
