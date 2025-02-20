import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const MUX_SIGNING_KEY = process.env.MUX_SIGNING_KEY;
const MUX_SIGNING_KEY_ID = process.env.MUX_SIGNING_KEY_ID;

if (!MUX_SIGNING_KEY || !MUX_SIGNING_KEY_ID) {
  console.error('Missing required environment variables for JWT signing');
}

// Extract and decode the base64 private key
function formatPrivateKey(key: string) {
  // Remove the "sk-{keyId}" prefix to get just the base64 encoded key
  const base64Key = key.split('LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQ')[1];
  
  if (!base64Key) {
    throw new Error('Invalid private key format');
  }

  // Decode the base64 key
  const decodedKey = Buffer.from(base64Key, 'base64').toString();
  
  // Add back the header
  return '-----BEGIN RSA PRIVATE KEY-----' + decodedKey;
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
