import Mux from '@mux/mux-node';
import { v4 as uuidv4 } from 'uuid';

// Only initialize Mux client on the server side
let Video: any = null;

// Function to initialize Mux client
function initMuxClient() {
  if (typeof window !== 'undefined') {
    return false; // Don't initialize on client side
  }
  
  if (Video) {
    return true; // Already initialized
  }
  
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.warn('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables must be set');
    return false;
  }
  
  try {
    // Initialize the Video API client directly
    const { Video: MuxVideo } = new Mux({ tokenId, tokenSecret });
    Video = MuxVideo;
    
    // Verify that Video API is properly initialized
    if (!Video) {
      console.warn('Failed to initialize Mux Video client properly');
      return false;
    }
    
    // Log success
    console.log('Mux client initialized successfully with Video API');
    return true;
  } catch (error) {
    console.error('Failed to initialize Mux client:', error);
    return false;
  }
}

// Initialize on module load
const initialized = initMuxClient();
console.log('Mux client initialization result:', initialized ? 'Success' : 'Failed');

// Debug function to check Video API
export function debugMuxVideo() {
  return {
    initialized,
    videoExists: !!Video,
    uploadsExists: Video && !!Video.Uploads,
    createMethodExists: Video && Video.Uploads && typeof Video.Uploads.create === 'function',
    assetsExists: Video && !!Video.Assets,
    videoKeys: Video ? Object.keys(Video) : [],
    uploadsKeys: Video && Video.Uploads ? Object.keys(Video.Uploads) : []
  };
}

// Export the Video object
export { Video };

export interface MuxUploadResponse {
  url: string;
  uploadId: string;
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

export interface MuxUploadStatusResponse {
  id: string;
  status: 'waiting' | 'asset_created' | 'errored' | 'cancelled';
  assetId?: string;
  error?: MuxError;
}

export async function waitForAssetReady(assetId: string, options = {
  maxAttempts: 60,  // 10 minutes total
  interval: 10000,  // 10 seconds between checks
  isFree: false
}): Promise<{status: string, playbackId?: string}> {
  let attempts = 0;

  const checkAsset = async () => {
    console.log(`Checking asset status (attempt ${attempts + 1}/${options.maxAttempts})`);
    
    const response = await fetch(`/api/mux/asset-status?assetId=${assetId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      if (response.status === 404) {
        throw new Error('Asset not found');
      }
      
      if (response.status >= 500) {
        // Server errors are retryable
        return null;
      }
      
      throw new Error(
        errorData.error || errorData.details || 
        `HTTP error! status: ${response.status}`
      );
    }
      
    const data = await response.json();
    
    console.log('Asset status response:', {
      status: response.status,
      data: JSON.stringify(data, null, 2)
    });

    if (data.status === 'ready' && data.playbackId) {
      console.log('Asset ready with playback ID:', data.playbackId);
      return {
        status: 'ready',
        playbackId: data.playbackId
      };
    }

    if (data.status === 'errored') {
      throw new Error('Video processing failed');
    }

    if (!['preparing', 'ready'].includes(data.status)) {
      throw new Error(`Unexpected asset status: ${data.status}`);
    }

    return null;
  };

  while (attempts < options.maxAttempts) {
    try {
      const result = await checkAsset();
      if (result) {
        return result;
      }
      
      attempts++;
      console.log(`Asset still processing, waiting ${options.interval}ms before next check`);
      await new Promise(resolve => setTimeout(resolve, options.interval));
    } catch (error) {
      console.error('Error checking asset status:', error);
      
      // If the error is retryable, continue
      if (error instanceof Error && 
          (error.message.includes('500') || error.message.includes('503'))) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, options.interval));
        continue;
      }
      
      throw error;
    }
  }

  console.error('Asset processing timed out after', attempts, 'attempts');
  throw new Error(`Video processing timed out after ${attempts} attempts`);
}

/**
 * Creates a new direct upload URL for Mux
 */
export async function createUpload(isFree: boolean = false): Promise<MuxUploadResponse> {
  // Ensure client is initialized
  if (!initMuxClient() || !Video) {
    throw new Error('Mux Video client not initialized - check your environment variables');
  }

  const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';

  try {
    // Check if Video.Uploads exists and has create method
    if (!Video.Uploads || typeof Video.Uploads.create !== 'function') {
      console.error('Video.Uploads.create is not a function:', Video);
      throw new Error('Mux Video API not properly initialized - Uploads.create method not available');
    }

    // Using the correct method from Mux docs
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: isFree ? ['public'] : ['signed'],
        encoding_tier: 'baseline'
      },
      cors_origin: corsOrigin,
    });

    if (!upload?.url || !upload?.id) {
      throw new Error('Invalid upload response from Mux');
    }

    return {
      url: upload.url,
      uploadId: upload.id
    };
  } catch (error) {
    console.error('Error creating Mux upload:', error);
    throw error;
  }
}

/**
 * Gets the status of a Mux upload
 */
export async function getUploadStatus(uploadId: string): Promise<MuxUploadStatusResponse> {
  // Ensure client is initialized
  if (!initMuxClient() || !Video) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    const upload = await Video.Uploads.get(uploadId);
    
    if (!upload) {
      throw new Error('Mux API returned null or undefined upload');
    }
    
    return {
      id: upload.id,
      status: upload.status as 'waiting' | 'asset_created' | 'errored' | 'cancelled',
      assetId: upload.asset_id,
      error: undefined
    };
  } catch (error) {
    console.error('Mux API error:', error);
    return {
      id: uploadId,
      status: 'errored',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'api_error'
      }
    };
  }
}

/**
 * Checks the status of a Mux asset
 */
export async function getAssetStatus(assetId: string): Promise<MuxAssetResponse> {
  // Ensure client is initialized
  if (!initMuxClient() || !Video) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    const asset = await Video.Assets.get(assetId);
    
    if (!asset) {
      throw new Error('Mux API returned null or undefined asset');
    }
    
    return {
      id: asset.id,
      status: asset.status as 'preparing' | 'ready' | 'errored',
      playbackId: asset.playback_ids?.[0]?.id,
      error: undefined
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

/**
 * Gets asset details
 */
export async function getAsset(assetId: string) {
  // Ensure client is initialized
  if (!initMuxClient() || !Video) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    const asset = await Video.Assets.get(assetId);
    return asset;
  } catch (error) {
    console.error(`Error getting Mux asset ${assetId}:`, error);
    throw error;
  }
}

/**
 * Gets upload details
 */
export async function getUpload(uploadId: string) {
  // Ensure client is initialized
  if (!initMuxClient() || !Video) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    const upload = await Video.Uploads.get(uploadId);
    return upload;
  } catch (error) {
    console.error(`Error getting Mux upload ${uploadId}:`, error);
    throw error;
  }
}

/**
 * Gets playback ID for an asset
 */
export async function getPlaybackId(assetId: string) {
  // Ensure client is initialized
  if (!initMuxClient() || !Video) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    const asset = await Video.Assets.get(assetId);
    
    if (!asset.playback_ids || asset.playback_ids.length === 0) {
      throw new Error('No playback IDs found for this asset');
    }
    
    return asset.playback_ids[0].id;
  } catch (error) {
    console.error(`Error getting playback ID for asset ${assetId}:`, error);
    throw error;
  }
}

/**
 * Deletes an asset
 */
export async function deleteAsset(assetId: string) {
  // Ensure client is initialized
  if (!initMuxClient() || !Video) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    await Video.Assets.del(assetId);
    return true;
  } catch (error) {
    console.error(`Error deleting Mux asset ${assetId}:`, error);
    throw error;
  }
}
