import Mux from '@mux/mux-node';

// Initialize Mux client with environment variables
const { Video } = new Mux({
  tokenId: process.env.NEXT_PUBLIC_MUX_TOKEN_ID || process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.NEXT_PUBLIC_MUX_TOKEN_SECRET || process.env.MUX_TOKEN_SECRET || ''
});

// Log warning if environment variables are missing
if (!process.env.NEXT_PUBLIC_MUX_TOKEN_ID && !process.env.MUX_TOKEN_ID) {
  console.warn('Warning: MUX_TOKEN_ID environment variable is not set');
}
if (!process.env.NEXT_PUBLIC_MUX_TOKEN_SECRET && !process.env.MUX_TOKEN_SECRET) {
  console.warn('Warning: MUX_TOKEN_SECRET environment variable is not set');
}

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
  interval: 10000,  // 10 seconds between checks
  isFree: false
}): Promise<{status: string, playbackId?: string}> {
  let attempts = 0;

  do {
    try {
      console.log(`Checking asset status (attempt ${attempts + 1}/${options.maxAttempts})`);
      
      const response = await fetch(`/api/video/asset-status?assetId=${assetId}&isFree=${options.isFree}`);
      let data;
      
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from asset status API');
      }
      
      console.log('Asset status response:', {
        status: response.status,
        data: JSON.stringify(data, null, 2)
      });

      if (!response.ok) {
        const errorMessage = data.error || data.details || `HTTP error! status: ${response.status}`;
        console.error('Asset status error:', {
          message: errorMessage,
          response: response.status,
          data
        });
        
        // If asset not found or server error, fail immediately
        if (response.status === 404 || response.status >= 500) {
          throw new Error(`Asset status check failed: ${errorMessage}`);
        }
        
        // For other errors, continue retrying
        attempts++;
        await new Promise(resolve => setTimeout(resolve, options.interval));
        continue;
      }
      console.log('Asset status API response:', { status: response.status, data });

      if (data.status === 'ready' && data.playbackId) {
        console.log('Asset ready with playback ID:', data.playbackId);
        return {
          status: 'ready',
          playbackId: data.playbackId
        };
      }

      if (data.status === 'error') {
        throw new Error('Video processing failed');
      }

      if (data.status) {
        console.log(`Asset status: ${data.status}, waiting ${options.interval}ms before next check`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, options.interval));
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from asset status API');
      }
    } catch (error) {
      console.error('Error checking asset status:', error);
      throw new Error(
        error instanceof Error 
          ? `Failed to check asset status: ${error.message}`
          : 'Failed to check asset status'
      );
    }
  } while (attempts < options.maxAttempts);

  console.error('Asset processing timed out after', attempts, 'attempts');
  throw new Error(`Video processing timed out after ${attempts} attempts`);
}

/**
 * Creates a new direct upload URL for Mux
 */
export async function createUpload(isFree: boolean = false): Promise<MuxUploadResponse> {
  const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';

  try {
    const upload = await Video.uploads.create({
      new_asset_settings: {
        playback_policy: isFree ? ['public'] : ['signed'],
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
    const asset = await Video.assets.get(assetId);
    
    return {
      id: asset.id,
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id,
      error: undefined // Simplified error handling
    };
  } catch (error) {
    console.error('Mux API error:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to get asset status: ${error.message}`
        : 'Failed to get asset status'
    );
  }
}
