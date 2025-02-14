import Mux from '@mux/mux-node';

// reads MUX_TOKEN_ID and MUX_TOKEN_SECRET from your environment
const mux = new Mux();
const { Video } = mux;

export async function createUpload() {
  const upload = await Video.Uploads.create({
    new_asset_settings: {
      playback_policy: ['public'],
      encoding_tier: 'baseline',
    },
    // in production, you'll want to change this origin to your-domain.com
    cors_origin: '*',
  });

  try {
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
