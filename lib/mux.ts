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
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
      },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL,
    });

    return upload;
  } catch (error) {
    console.error('Mux upload creation error:', error);
    throw error;
  }
}
