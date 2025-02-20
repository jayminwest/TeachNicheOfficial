import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const MUX_SIGNING_KEY = process.env.MUX_SIGNING_KEY;
const MUX_SIGNING_KEY_ID = process.env.MUX_SIGNING_KEY_ID;

if (!MUX_SIGNING_KEY || !MUX_SIGNING_KEY_ID) {
  throw new Error('Missing required environment variables for JWT signing');
}

export async function POST(request: Request) {
  try {
    const { playbackId } = await request.json();

    if (!playbackId) {
      return NextResponse.json({ error: 'Playback ID is required' }, { status: 400 });
    }

    if (!MUX_SIGNING_KEY || !MUX_SIGNING_KEY_ID) {
      throw new Error('Missing required environment variables for JWT signing');
    }

    const token = jwt.sign(
      {
        sub: playbackId,
        aud: 'v',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        kid: MUX_SIGNING_KEY_ID,
      },
      MUX_SIGNING_KEY,
      { algorithm: 'RS256' } as jwt.SignOptions
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error signing playback token:', error);
    return NextResponse.json(
      { error: 'Failed to sign playback token' },
      { status: 500 }
    );
  }
}
