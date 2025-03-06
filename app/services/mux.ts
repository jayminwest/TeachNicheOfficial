import Mux from '@mux/mux-node';
import { PlaybackPolicy } from '@mux/mux-node/resources/video/shared';

// Define types for better type safety
export interface MuxAssetResponse {
  id: string;
  status: 'preparing' | 'ready' | 'errored';
  playbackId?: string;
  error?: {
    message: string;
    type: string;
  };
}

// Create and export a singleton Mux client
let _muxClient: Mux | null = null;
export function getMuxClient() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables must be set');
  }

  if (!_muxClient) {
    _muxClient = new Mux({ tokenId, tokenSecret });
  }
  
  return _muxClient;
}

// Export the singleton client for direct use
export const muxClient = process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET 
  ? new Mux({ 
      tokenId: process.env.MUX_TOKEN_ID, 
      tokenSecret: process.env.MUX_TOKEN_SECRET 
    }) 
  : null;

// Debug function to inspect the Mux client
export function debugMuxClient() {
  try {
    const client = getMuxClient();
    return {
      initialized: !!client,
      hasVideo: !!client?.video,
      hasAssets: !!client?.video?.assets,
      hasUploads: !!client?.video?.uploads,
      methods: {
        assets: Object.keys(client?.video?.assets || {}),
        uploads: Object.keys(client?.video?.uploads || {})
      }
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      initialized: false
    };
  }
}

// Simple API functions that use the client directly
export async function createUpload(isFree: boolean = false) {
  const mux = getMuxClient();
  const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';

  // Use public policy for free content, signed for paid content
  // This is consistent across all environments
  const playbackPolicy: PlaybackPolicy[] = isFree ? ['public'] : ['signed'];
  
  console.log(`Creating upload with playback policy: ${playbackPolicy.join(', ')}`);

  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: playbackPolicy,
      encoding_tier: 'baseline'
    },
    cors_origin: corsOrigin,
  });

  return {
    url: upload.url,
    uploadId: upload.id
  };
}

export async function getUploadStatus(uploadId: string) {
  const mux = getMuxClient();
  const upload = await mux.video.uploads.retrieve(uploadId);
  
  return {
    id: upload.id,
    status: upload.status,
    assetId: upload.asset_id
  };
}

export async function getAssetStatus(assetId: string): Promise<MuxAssetResponse> {
  const mux = getMuxClient();
  const asset = await mux.video.assets.retrieve(assetId);
  
  // Get the playback ID if the asset is ready
  let playbackId = undefined;
  if (asset.status === 'ready') {
    // Check if we have any playback IDs
    if (asset.playback_ids && asset.playback_ids.length > 0) {
      // In development, prefer public playback IDs
      if (process.env.NODE_ENV === 'development') {
        // Look for a public playback ID first
        const publicId = asset.playback_ids.find(id => id.policy === 'public');
        if (publicId) {
          playbackId = publicId.id;
        } else {
          // If no public ID exists, create one
          console.log(`Creating public playback ID for asset ${assetId} in development`);
          try {
            const newPlaybackId = await mux.video.assets.createPlaybackId(assetId, {
              policy: 'public'
            });
            playbackId = newPlaybackId.id;
          } catch (error) {
            console.error(`Error creating public playback ID: ${error}`);
            // Fall back to the first available ID
            playbackId = asset.playback_ids[0].id;
          }
        }
      } else {
        // In production, just use the first playback ID
        playbackId = asset.playback_ids[0].id;
      }
    } else if (asset.status === 'ready') {
      // If the asset is ready but has no playback IDs, create one
      console.log(`Asset ${assetId} is ready but has no playback IDs, creating one`);
      try {
        // In development, always create public playback IDs
        const policy = process.env.NODE_ENV === 'development' ? 'public' : 'signed';
        const newPlaybackId = await mux.video.assets.createPlaybackId(assetId, {
          policy
        });
        playbackId = newPlaybackId.id;
      } catch (error) {
        console.error(`Error creating playback ID: ${error}`);
      }
    }
  }
  
  return {
    id: asset.id,
    status: asset.status as 'preparing' | 'ready' | 'errored',
    playbackId
  };
}

/**
 * Wait for an asset to be ready
 */
export async function waitForAssetReady(assetId: string, options: { maxAttempts?: number; interval?: number } = {}) {
  const { maxAttempts = 60, interval = 10000 } = options;
  
  // Handle temporary asset IDs
  if (assetId.startsWith('temp_')) {
    // For temporary assets, extract the upload ID
    const uploadId = assetId.substring(5);
    
    // Try to get the upload to check if it has an asset ID
    try {
      const mux = getMuxClient();
      // Use the correct method to get upload status
      const upload = await mux.video.uploads.retrieve(uploadId);
      
      if (upload.asset_id) {
        // If the upload has an asset ID, use that instead
        assetId = upload.asset_id;
      } else {
        // If the upload doesn't have an asset ID yet, wait for it
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, interval));
          
          const updatedUpload = await mux.video.uploads.retrieve(uploadId);
          
          if (updatedUpload.asset_id) {
            assetId = updatedUpload.asset_id;
            break;
          }
          
          if (updatedUpload.status === 'errored') {
            throw new Error(`Upload failed: ${updatedUpload.error?.message || 'Unknown error'}`);
          }
        }
        
        // If we still don't have an asset ID, throw an error
        if (assetId.startsWith('temp_')) {
          throw new Error('Timed out waiting for asset ID');
        }
      }
    } catch (error) {
      console.error('Error getting upload:', error);
      throw new Error('Failed to get upload status');
    }
  }
  
  // Now we should have a real asset ID
  const mux = getMuxClient();
  
  // Poll for asset status
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Use the correct method to get asset status
      const asset = await mux.video.assets.retrieve(assetId);
      
      if (asset.status === 'ready') {
        // Get the playback ID
        const playbackIds = asset.playback_ids || [];
        const playbackId = playbackIds.length > 0 ? playbackIds[0].id : null;
        
        if (!playbackId) {
          throw new Error('Asset is ready but has no playback ID');
        }
        
        return {
          status: 'ready',
          playbackId,
          assetId
        };
      }
      
      if (asset.status === 'errored') {
        throw new Error('Asset processing failed');
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      console.error(`Error checking asset status (attempt ${attempt + 1}):`, error);
      
      // If this is the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Otherwise, wait and try again
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error('Timed out waiting for asset to be ready');
}

export async function getAssetIdFromUpload(uploadId: string): Promise<string> {
  const mux = getMuxClient();
  
  try {
    // Try to get the upload directly
    const upload = await mux.video.uploads.retrieve(uploadId);
    
    if (!upload.asset_id) {
      // Check if the upload is still processing
      if (upload.status === 'waiting') {
        throw new Error('Upload is still processing, no asset ID available yet');
      }
      
      // Check if the upload has errored
      if (upload.status === 'errored') {
        const errorMessage = upload.error ? JSON.stringify(upload.error) : 'Unknown error';
        throw new Error(`Upload failed: ${errorMessage}`);
      }
      
      throw new Error('No asset ID found for this upload');
    }
    
    return upload.asset_id;
  } catch (error) {
    console.error(`Error getting asset ID from upload ${uploadId}:`, error);
    
    // If we get an invalid parameters error, it might be a Mux ID format issue
    // Try to get the most recent upload as a fallback
    if (error instanceof Error && 
        (error.message.includes('invalid_parameters') || 
         error.message.includes('Failed to parse ID'))) {
      console.log('Invalid upload ID format, trying to get most recent upload...');
      
      try {
        const uploads = await mux.video.uploads.list({ limit: 1 });
        
        if (uploads && uploads.data && uploads.data.length > 0) {
          const latestUpload = uploads.data[0];
          
          if (latestUpload.asset_id) {
            console.log(`Found asset ID ${latestUpload.asset_id} from most recent upload`);
            return latestUpload.asset_id;
          } else {
            throw new Error('Most recent upload does not have an asset ID yet');
          }
        } else {
          throw new Error('No recent uploads found');
        }
      } catch (fallbackError) {
        console.error('Error getting recent uploads:', fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

export async function deleteAsset(assetId: string): Promise<boolean> {
  const mux = getMuxClient();
  await mux.video.assets.delete(assetId);
  return true;
}

export async function listRecentUploads(limit: number = 10) {
  const mux = getMuxClient();
  return mux.video.uploads.list({ limit });
}

export async function getPlaybackId(assetId: string, isFree: boolean = false): Promise<string> {
  const mux = getMuxClient();
  
  try {
    const asset = await mux.video.assets.retrieve(assetId);
    
    if (!asset.playback_ids || asset.playback_ids.length === 0) {
      // If no playback IDs exist, create one with the appropriate policy
      console.log(`No playback IDs found for asset ${assetId}, creating one with policy: ${isFree ? 'public' : 'signed'}`);
      const playbackId = await mux.video.assets.createPlaybackId(assetId, {
        policy: isFree ? 'public' : 'signed'
      });
      return playbackId.id;
    }
    
    // Check if we have a playback ID with the right policy
    const existingId = asset.playback_ids.find(id => 
      (isFree && id.policy === 'public') || (!isFree && id.policy === 'signed')
    );
    
    if (existingId) {
      return existingId.id;
    }
    
    // If we don't have a playback ID with the right policy, create one
    console.log(`Creating new playback ID with policy: ${isFree ? 'public' : 'signed'}`);
    const newPlaybackId = await mux.video.assets.createPlaybackId(assetId, {
      policy: isFree ? 'public' : 'signed'
    });
    return newPlaybackId.id;
  } catch (error) {
    console.error(`Error getting playback ID for asset ${assetId}:`, error);
    throw error;
  }
}

/**
 * Signs a playback ID for secure viewing
 */
export async function signPlaybackId(playbackId: string, duration: number = 3600): Promise<string> {
  const jwt = await import('jsonwebtoken');
  
  // Make sure we have the required environment variables
  const signingKey = process.env.MUX_SIGNING_KEY;
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID;
  
  if (!signingKey || !signingKeyId) {
    throw new Error('MUX_SIGNING_KEY and MUX_SIGNING_KEY_ID environment variables must be set');
  }
  
  // Create the JWT payload
  const payload = {
    sub: playbackId,
    exp: Math.floor(Date.now() / 1000) + duration,
    kid: signingKeyId,
    aud: 'v' // Audience is 'v' for video
  };
  
  // Sign the JWT
  return jwt.default.sign(payload, signingKey, { algorithm: 'RS256' });
}
