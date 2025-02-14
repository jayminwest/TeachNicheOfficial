import Mux from '@mux/mux-node';

const { Video } = new Mux(
  process.env.MUX_TOKEN_ID!,
  process.env.MUX_TOKEN_SECRET!
);

export async function createUpload() {
  const upload = await Video.Uploads.create({
    new_asset_settings: {
      playback_policy: ['public'],
    },
    cors_origin: process.env.NEXT_PUBLIC_APP_URL,
  });

  return upload;
}
