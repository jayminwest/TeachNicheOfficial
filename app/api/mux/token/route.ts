import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playbackId = searchParams.get('playbackId');
    
    if (!playbackId) {
      return NextResponse.json(
        { error: 'Playback ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get environment variables for signing
    const muxTokenSecret = process.env.MUX_SIGNING_KEY;
    const muxTokenId = process.env.MUX_SIGNING_KEY_ID;
    
    if (!muxTokenSecret || !muxTokenId) {
      console.error('Missing MUX_SIGNING_KEY or MUX_SIGNING_KEY_ID environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Create JWT tokens for Mux
    // All tokens use the same signing key and expiry, but different audience values
    const playbackToken = jwt.sign(
      {
        sub: playbackId,
        aud: 'v',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        kid: muxTokenId
      },
      Buffer.from(muxTokenSecret, 'base64'),
      { algorithm: 'HS256' }
    );
    
    const thumbnailToken = jwt.sign(
      {
        sub: playbackId,
        aud: 't',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        kid: muxTokenId
      },
      Buffer.from(muxTokenSecret, 'base64'),
      { algorithm: 'HS256' }
    );
    
    const storyboardToken = jwt.sign(
      {
        sub: playbackId,
        aud: 's',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        kid: muxTokenId
      },
      Buffer.from(muxTokenSecret, 'base64'),
      { algorithm: 'HS256' }
    );
    
    return NextResponse.json({ 
      token: playbackToken,
      thumbnailToken,
      storyboardToken
    });
  } catch (error) {
    console.error('Error generating playback token:', error);
    return NextResponse.json(
      { error: 'Failed to generate playback token' },
      { status: 500 }
    );
  }
}
