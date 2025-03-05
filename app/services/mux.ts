import Mux from '@mux/mux-node';
import { v4 as uuidv4 } from 'uuid';

// Only initialize Mux client on the server side
let muxClient: any = null;

// Function to initialize Mux client
function initMuxClient() {
  if (typeof window !== 'undefined') {
    return false; // Don't initialize on client side
  }
  
  if (muxClient) {
    return true; // Already initialized
  }
  
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.warn('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables must be set');
    return false;
  }
  
  try {
    // Initialize the client according to v9.0.1 documentation
    muxClient = new Mux({ tokenId, tokenSecret });
    
    // Verify that client is properly initialized
    if (!muxClient) {
      console.warn('Failed to initialize Mux client properly');
      return false;
    }
    
    // Log success
    console.log('Mux client initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Mux client:', error);
    return false;
  }
}

// Initialize on module load
const initialized = initMuxClient();
console.log('Mux client initialization result:', initialized ? 'Success' : 'Failed');

// Debug function to check Mux client
export function debugMuxClient() {
  return {
    initialized,
    clientExists: !!muxClient,
    videoExists: muxClient && !!muxClient.video,
    uploadsExists: muxClient && muxClient.video && !!muxClient.video.uploads,
    createMethodExists: muxClient && muxClient.video && muxClient.video.uploads && 
                      typeof muxClient.video.uploads.create === 'function',
    assetsExists: muxClient && muxClient.video && !!muxClient.video.assets,
    clientKeys: muxClient ? Object.keys(muxClient) : [],
    videoKeys: muxClient && muxClient.video ? Object.keys(muxClient.video) : [],
    uploadsKeys: muxClient && muxClient.video && muxClient.video.uploads ? 
                Object.keys(muxClient.video.uploads) : []
  };
}

// Export the muxClient object
export { muxClient };

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

/**
 * Gets the asset ID from an upload ID
 */
export async function getAssetIdFromUpload(uploadId: string, options = {
  maxAttempts: 10,
  interval: 2000
}): Promise<string> {
  // Ensure client is initialized
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.uploads) {
    throw new Error('Mux Video client not properly initialized');
  }

  let attempts = 0;
  
  while (attempts < options.maxAttempts) {
    try {
      console.log(`Checking upload status for ${uploadId} (attempt ${attempts + 1}/${options.maxAttempts})`);
      
      const upload = await muxClient.video.uploads.get(uploadId);
      
      if (!upload) {
        throw new Error('Mux API returned null or undefined upload');
      }
      
      // If the upload has created an asset, return the asset ID
      if (upload.status === 'asset_created' && upload.asset_id) {
        console.log(`Upload ${uploadId} has created asset ${upload.asset_id}`);
        return upload.asset_id;
      }
      
      // If the upload has errored, throw an error
      if (upload.status === 'errored') {
        throw new Error('Upload failed: ' + (upload.error?.message || 'Unknown error'));
      }
      
      // If the upload is still waiting, wait and try again
      attempts++;
      await new Promise(resolve => setTimeout(resolve, options.interval));
    } catch (error) {
      console.error(`Error checking upload status for ${uploadId}:`, error);
      
      // If we've reached the maximum number of attempts, throw an error
      if (attempts >= options.maxAttempts - 1) {
        throw error;
      }
      
      // Otherwise, wait and try again
      attempts++;
      await new Promise(resolve => setTimeout(resolve, options.interval));
    }
  }
  
  throw new Error(`Timed out waiting for upload ${uploadId} to create an asset`);
}

export async function waitForAssetReady(assetId: string, options = {
  maxAttempts: 30,
  interval: 5000,
  isFree: false
}): Promise<{status: string, playbackId?: string}> {
  // Ensure client is initialized
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.assets) {
    throw new Error('Mux Video client not properly initialized');
  }

  let attempts = 0;

  while (attempts < options.maxAttempts) {
    try {
      console.log(`Checking asset status for ${assetId} (attempt ${attempts + 1}/${options.maxAttempts})`);
      
      const asset = await muxClient.video.assets.get(assetId);
      
      if (!asset) {
        throw new Error('Mux API returned null or undefined asset');
      }
      
      // If the asset is ready, return the status and playback ID
      if (asset.status === 'ready' && asset.playback_ids && asset.playback_ids.length > 0) {
        return {
          status: 'ready',
          playbackId: asset.playback_ids[0].id
        };
      }
      
      // If the asset has errored, throw an error
      if (asset.status === 'errored') {
        throw new Error('Video processing failed');
      }
      
      // If the asset is still preparing, wait and try again
      attempts++;
      await new Promise(resolve => setTimeout(resolve, options.interval));
    } catch (error) {
      console.error(`Error checking asset status for ${assetId}:`, error);
      
      // If we've reached the maximum number of attempts, throw an error
      if (attempts >= options.maxAttempts - 1) {
        throw error;
      }
      
      // Otherwise, wait and try again
      attempts++;
      await new Promise(resolve => setTimeout(resolve, options.interval));
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
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.uploads) {
    throw new Error('Mux Video client not initialized - check your environment variables');
  }

  const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';

  try {
    // Using the correct method from Mux docs
    const upload = await muxClient.video.uploads.create({
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
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.uploads) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    const upload = await muxClient.video.uploads.get(uploadId);
    
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
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.assets) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  // Don't try to get status for temporary asset IDs
  if (assetId.startsWith('temp_')) {
    return {
      id: assetId,
      status: 'preparing',
      error: {
        message: 'This is a temporary asset ID',
        type: 'temp_asset'
      }
    };
  }

  try {
    const asset = await muxClient.video.assets.get(assetId);
    
    if (!asset) {
      throw new Error('Mux API returned null or undefined asset');
    }
    
    // Log more details about the asset for debugging
    console.log(`Asset ${assetId} status: ${asset.status}, playback IDs:`, 
      asset.playback_ids ? asset.playback_ids.map(p => p.id).join(', ') : 'none');
    
    return {
      id: asset.id,
      status: asset.status as 'preparing' | 'ready' | 'errored',
      playbackId: asset.playback_ids?.[0]?.id,
      error: undefined
    };
  } catch (error) {
    console.error('Mux API error:', error);
    
    // Provide more detailed error information
    let errorType = 'unknown';
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('not found')) {
        errorType = 'not_found';
      } else if (errorMessage.includes('rate limit')) {
        errorType = 'rate_limit';
      } else if (errorMessage.includes('unauthorized')) {
        errorType = 'auth_error';
      }
    }
    
    return {
      id: assetId,
      status: 'errored',
      error: {
        message: errorMessage,
        type: errorType
      }
    };
  }
}

/**
 * Gets asset details
 */
export async function getAsset(assetId: string) {
  // Ensure client is initialized
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.assets) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    const asset = await muxClient.video.assets.get(assetId);
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
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.uploads) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    const upload = await muxClient.video.uploads.get(uploadId);
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
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.assets) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    const asset = await muxClient.video.assets.get(assetId);
    
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
  if (!initMuxClient() || !muxClient || !muxClient.video || !muxClient.video.assets) {
    throw new Error('Mux Video client not properly initialized - check your environment variables');
  }

  try {
    await muxClient.video.assets.del(assetId);
    return true;
  } catch (error) {
    console.error(`Error deleting Mux asset ${assetId}:`, error);
    throw error;
  }
}
