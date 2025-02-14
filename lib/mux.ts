import Mux from '@mux/mux-node';

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Missing required Mux environment variables');
}

const mux = new Mux();
const { Video } = mux;

export async function createUpload() {
  try {
    const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';
    
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
      },
      cors_origin: corsOrigin,
    });

    return upload;
  } catch (error) {
    console.error('Mux upload creation error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      tokenIdExists: !!process.env.MUX_TOKEN_ID,
      tokenSecretExists: !!process.env.MUX_TOKEN_SECRET,
      corsOrigin: process.env.NEXT_PUBLIC_BASE_URL
    });
    
    // Throw a cleaner error for the API route to handle
    throw new Error('Failed to initialize Mux upload');
  }
}
