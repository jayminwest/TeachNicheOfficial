import Mux from '@mux/mux-node';

const { Video } = new Mux(
  process.env.MUX_TOKEN_ID!,
  process.env.MUX_TOKEN_SECRET!
);

export async function createUpload() {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error('MUX credentials are not configured');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }

  try {
    console.log('Creating Mux upload with config:', {
      cors_origin: process.env.NEXT_PUBLIC_APP_URL
    });

    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
      },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL,
    });

    console.log('Mux upload created successfully:', {
      id: upload.id,
      hasUrl: !!upload.url
    });

    return upload;
  } catch (error) {
    console.error('Mux upload creation error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      tokenIdExists: !!process.env.MUX_TOKEN_ID,
      tokenSecretExists: !!process.env.MUX_TOKEN_SECRET,
      corsOrigin: process.env.NEXT_PUBLIC_APP_URL
    });
    throw error;
  }
}
