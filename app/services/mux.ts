import Mux from '@mux/mux-node';

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

// Create a simple function to get a Mux client
export function getMuxClient() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables must be set');
  }

  return new Mux({ tokenId, tokenSecret });
}

// Simple API functions that use the client directly
export async function createUpload(isFree: boolean = false) {
  const mux = getMuxClient();
  const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';

  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: isFree ? ['public'] : ['signed'],
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
  if (asset.status === 'ready' && asset.playback_ids && asset.playback_ids.length > 0) {
    playbackId = asset.playback_ids[0].id;
  }
  
  return {
    id: asset.id,
    status: asset.status as 'preparing' | 'ready' | 'errored',
    playbackId
  };
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

export async function getPlaybackId(assetId: string): Promise<string> {
  const mux = getMuxClient();
  
  try {
    const asset = await mux.video.assets.retrieve(assetId);
    
    if (!asset.playback_ids || asset.playback_ids.length === 0) {
      throw new Error('No playback IDs found for this asset');
    }
    
    return asset.playback_ids[0].id;
  } catch (error) {
    console.error(`Error getting playback ID for asset ${assetId}:`, error);
    throw error;
  }
}
