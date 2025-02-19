import Mux from '@mux/mux-node';

// Validate environment variables at startup
if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Missing required Mux environment variables');
}

// Initialize Mux client
const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || ''
}).video;

export { Video };

export interface MuxUploadResponse {
  url: string;
  id: string;
}

interface MuxError {
  message: string;
  type: string;
}

export interface MuxAssetResponse {
  id: string;
  status: 'preparing' | 'ready' | 'errored';
  playbackId?: string;
  error?: MuxError;
}

export async function waitForAssetReady(assetId: string, options = {
  maxAttempts: 30,  // 5 minutes total
  interval: 10000   // 10 seconds between checks
}): Promise<{status: string, playbackId?: string}> {
  let attempts = 0;

  while (attempts < options.maxAttempts) {
    const response = await fetch(`/api/mux/asset-status?assetId=${assetId}`);
    const data = await response.json();

    if (data.status === 'ready' && data.playbackId) {
      return {
        status: 'ready',
        playbackId: data.playbackId
      };
    }

    if (data.status === 'errored') {
      throw new Error('Video processing failed');
    }

    await new Promise(resolve => setTimeout(resolve, options.interval));
    attempts++;
  }

  throw new Error('Video processing timeout');
}

/**
 * Creates a new direct upload URL for Mux
 */
export async function createUpload(): Promise<MuxUploadResponse> {
  const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';

  try {
    const upload = await Video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
      },
      cors_origin: corsOrigin,
    });

    if (!upload?.url || !upload?.id) {
      throw new Error('Invalid upload response from Mux');
    }

    return {
      url: upload.url,
      id: upload.id
    };
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? `Failed to initialize Mux upload: ${error.message}`
        : 'Failed to initialize Mux upload'
    );
  }
}

/**
 * Checks the status of a Mux asset
 */
export async function getAssetStatus(assetId: string): Promise<MuxAssetResponse> {
  try {
    const asset = await Video.assets.retrieve(assetId);
    
    return {
      id: asset.id,
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id,
      error: undefined // Simplified error handling
    };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to get asset status: ${error.message}`
        : 'Failed to get asset status'
    );
  }
}
