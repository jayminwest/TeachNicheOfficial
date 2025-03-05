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
  const upload = await mux.video.uploads.retrieve(uploadId);
  
  if (!upload.asset_id) {
    throw new Error('No asset ID found for this upload');
  }
  
  return upload.asset_id;
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
