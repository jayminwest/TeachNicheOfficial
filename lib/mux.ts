import Mux from '@mux/mux-node';

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

const { Video } = muxClient;

export async function createUpload() {
  // Validate environment variables
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    console.error('Missing MUX credentials');
    throw new Error('MUX credentials are not configured');
  }

  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    console.error('Missing NEXT_PUBLIC_BASE_URL');
    throw new Error('NEXT_PUBLIC_BASE_URL is not configured');
  }

  try {
    const config = {
      new_asset_settings: {
        playback_policy: ['public'],
      },
      cors_origin: process.env.NEXT_PUBLIC_BASE_URL,
    };

    console.log('Creating Mux upload with config:', {
      ...config,
      hasTokenId: !!process.env.MUX_TOKEN_ID,
      hasTokenSecret: !!process.env.MUX_TOKEN_SECRET,
    });

    const upload = await Video.Uploads.create(config);

    if (!upload) {
      throw new Error('Mux API returned null response');
    }

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
      corsOrigin: process.env.NEXT_PUBLIC_BASE_URL
    });
    throw error;
  }
}
