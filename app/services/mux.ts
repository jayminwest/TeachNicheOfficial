import Mux from '@mux/mux-node';

// Only initialize Mux client on the server side
let muxClient: Mux | null = null;
let Video: Mux['video'] | null = null;

if (typeof window === 'undefined') {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables must be set');
  }

  try {
    // Initialize the client
    muxClient = new Mux({
      tokenId,
      tokenSecret
    });

    Video = muxClient.video;
    
    if (!Video || typeof Video.assets?.retrieve !== 'function') {
      throw new Error('Failed to initialize Mux Video client properly');
    }
  } catch (error) {
    console.error('Failed to initialize Mux client:', error);
    throw new Error('Failed to initialize Mux client');
  }
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
  if (!Video) {
    throw new Error('Mux Video client not initialized');
  }

  const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';

  try {
    const upload = await Video.uploads.create({
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
 * Gets the status of a Mux upload
 */
export async function getUploadStatus(uploadId: string): Promise<MuxUploadStatusResponse> {
  if (!Video || typeof Video.uploads?.retrieve !== 'function') {
    throw new Error('Mux Video client not properly initialized');
  }

  try {
    const upload = await Video.uploads.retrieve(uploadId);
    
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
  if (!Video || typeof Video.assets?.retrieve !== 'function') {
    throw new Error('Mux Video client not properly initialized');
  }

  try {
    const asset = await Video.assets.retrieve(assetId);
    
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
import Mux from '@mux/mux-node';
import { v4 as uuidv4 } from 'uuid';

// Initialize Mux client
const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Create a direct upload URL
export async function createUpload() {
  try {
    if (!Video || typeof Video.Uploads?.create !== 'function') {
      throw new Error('Mux Video client not properly initialized');
    }

    // Generate a unique ID for this upload
    const uploadId = uuidv4();

    // Create a new direct upload
    const upload = await Video.Uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
      },
    });

    // Validate the response
    if (!upload || !upload.id || !upload.url) {
      throw new Error('Invalid response from Mux API');
    }

    // Return the upload URL and ID
    return {
      url: upload.url,
      uploadId: upload.id,
    };
  } catch (error) {
    console.error('Error creating Mux upload:', error);
    throw error;
  }
}

// Get asset details
export async function getAsset(assetId: string) {
  try {
    if (!Video || typeof Video.Assets?.get !== 'function') {
      throw new Error('Mux Video client not properly initialized');
    }

    const asset = await Video.Assets.get(assetId);
    return asset;
  } catch (error) {
    console.error(`Error getting Mux asset ${assetId}:`, error);
    throw error;
  }
}

// Get upload details
export async function getUpload(uploadId: string) {
  try {
    if (!Video || typeof Video.Uploads?.get !== 'function') {
      throw new Error('Mux Video client not properly initialized');
    }

    const upload = await Video.Uploads.get(uploadId);
    return upload;
  } catch (error) {
    console.error(`Error getting Mux upload ${uploadId}:`, error);
    throw error;
  }
}

// Get playback ID for an asset
export async function getPlaybackId(assetId: string) {
  try {
    if (!Video || typeof Video.Assets?.get !== 'function') {
      throw new Error('Mux Video client not properly initialized');
    }

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

// Delete an asset
export async function deleteAsset(assetId: string) {
  try {
    if (!Video || typeof Video.Assets?.del !== 'function') {
      throw new Error('Mux Video client not properly initialized');
    }

    await Video.Assets.del(assetId);
    return true;
  } catch (error) {
    console.error(`Error deleting Mux asset ${assetId}:`, error);
    throw error;
  }
}
