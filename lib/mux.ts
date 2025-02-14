import Mux from '@mux/mux-node';

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Missing required Mux environment variables');
}

const mux = new Mux();
const { Video } = mux;

export interface MuxUploadResponse {
  url: string;
  id: string;
}

export async function createUpload(): Promise<MuxUploadResponse> {
  try {
    // Log environment check
    console.log('Checking Mux environment:', {
      tokenIdExists: !!process.env.MUX_TOKEN_ID,
      tokenSecretLength: process.env.MUX_TOKEN_SECRET?.length,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      nodeEnv: process.env.NODE_ENV
    });

    const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';
    console.log('Using CORS origin:', corsOrigin);
    
    console.log('Attempting to create Mux upload...');
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
      },
      cors_origin: corsOrigin,
    });
    console.log('Raw Mux upload response:', JSON.stringify(upload, null, 2));

    if (!upload?.url || !upload?.id) {
      console.error('Invalid Mux upload response:', {
        hasUrl: !!upload?.url,
        hasId: !!upload?.id,
        upload
      });
      throw new Error('Mux returned an invalid upload response');
    }

    console.log('Successfully created Mux upload:', {
      id: upload.id,
      urlLength: upload.url.length,
      corsOrigin
    });

    return {
      url: upload.url,
      id: upload.id
    };
  } catch (error) {
    console.error('Mux upload creation error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      tokenIdExists: !!process.env.MUX_TOKEN_ID,
      tokenSecretExists: !!process.env.MUX_TOKEN_SECRET,
      corsOrigin: process.env.NEXT_PUBLIC_BASE_URL
    });
    
    // Throw a cleaner error for the API route to handle
    throw new Error(
      error instanceof Error 
        ? `Failed to initialize Mux upload: ${error.message}`
        : 'Failed to initialize Mux upload'
    );
  }
}
