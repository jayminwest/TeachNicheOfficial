import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const MUX_SIGNING_KEY = process.env.MUX_SIGNING_KEY;
const MUX_SIGNING_KEY_ID = process.env.MUX_SIGNING_KEY_ID;

if (!MUX_SIGNING_KEY || !MUX_SIGNING_KEY_ID) {
  console.error('Missing required environment variables for JWT signing');
}

// Format the private key by adding newlines
function formatPrivateKey(key: string) {
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';
  
  // Remove existing headers/footers and whitespace
  const cleanKey = key
    .replace(header, '')
    .replace(footer, '')
    .replace(/\s/g, '');

  // Add newlines every 64 characters
  const chunks = cleanKey.match(/.{1,64}/g) || [];
  const formattedKey = chunks.join('\n');

  return `${header}\n${formattedKey}\n${footer}`;
}

export async function POST(request: Request) {
  try {
    const { playbackId } = await request.json();

    if (!playbackId) {
      return NextResponse.json({ error: 'Playback ID is required' }, { status: 400 });
    }

    const formattedKey = formatPrivateKey(MUX_SIGNING_KEY!);

    const token = jwt.sign(
      {
        sub: playbackId,
        aud: 'v',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        kid: MUX_SIGNING_KEY_ID,
      },
      formattedKey,
      { algorithm: 'RS256' }
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
