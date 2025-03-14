import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playbackId = searchParams.get('playbackId');
    const refresh = searchParams.get('refresh') === 'true';
    
    if (!playbackId) {
      return NextResponse.json(
        { error: 'Playback ID is required' },
        { status: 400 }
      );
    }
    
    // Check if this is actually a signed playback ID
    if (!playbackId.includes('_')) {
      return NextResponse.json(
        { error: 'Not a signed playback ID' },
        { status: 400 }
      );
    }
    
    // Check if user is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // For refresh requests, we'll be more lenient and try to generate a token
    // even without a session, as this might be a public video
    if (!session?.user && !refresh) {
      console.error('Token request unauthorized - no session');
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
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = now + 24 * 3600; // 24 hour expiry for better user experience
    
    // For debugging
    console.log(`Generating token for playback ID: ${playbackId}`);
    console.log(`Using key ID: ${muxTokenId}`);
    console.log(`Token will expire in 24 hours (${new Date(expiryTime * 1000).toISOString()})`);
    console.log(`Refresh requested: ${refresh}`);
    
    const playbackToken = jwt.sign(
      {
        sub: playbackId,
        aud: 'v',
        exp: expiryTime,
        kid: muxTokenId
      },
      Buffer.from(muxTokenSecret, 'base64'),
      { algorithm: 'HS256' }
    );
    
    const thumbnailToken = jwt.sign(
      {
        sub: playbackId,
        aud: 't',
        exp: expiryTime,
        kid: muxTokenId
      },
      Buffer.from(muxTokenSecret, 'base64'),
      { algorithm: 'HS256' }
    );
    
    const storyboardToken = jwt.sign(
      {
        sub: playbackId,
        aud: 's',
        exp: expiryTime,
        kid: muxTokenId
      },
      Buffer.from(muxTokenSecret, 'base64'),
      { algorithm: 'HS256' }
    );
    
    // For debugging - log token length but not the actual token
    console.log(`Generated playback token length: ${playbackToken.length} chars`);
    
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
