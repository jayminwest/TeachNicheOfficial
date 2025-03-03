import Mux from "@mux/mux-node";

// Initialize Mux client with environment variables
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
});
const { video } = muxClient;

export interface MuxUploadResponse {
  url: string;
  uploadId: string;
}

export interface MuxAssetStatusResponse {
  status: string;
  playbackId?: string;
  error?: string;
}

export interface MuxUploadStatusResponse {
  status: string;
  assetId?: string;
  error?: string;
}

/**
 * Creates a new direct upload URL
 */
export async function createUpload(): Promise<MuxUploadResponse> {
  const upload = await video.uploads.create({
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline",
    },
    cors_origin: "*",
  });
  
  return {
    url: upload.url,
    uploadId: upload.id
  };
}

/**
 * Gets the status of an upload by ID
 */
export async function getUploadStatus(uploadId: string): Promise<MuxUploadStatusResponse> {
  try {
    const upload = await video.uploads.get(uploadId);
    
    if (upload.asset_id) {
      return {
        status: upload.status,
        assetId: upload.asset_id
      };
    }
    
    return {
      status: upload.status
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets the status of an asset by ID
 */
export async function getAssetStatus(assetId: string): Promise<MuxAssetStatusResponse> {
  try {
    const asset = await video.assets.get(assetId);
    
    // Find the public playback ID
    const playbackId = asset.playback_ids?.find(
      id => id.policy === 'public'
    )?.id;
    
    return {
      status: asset.status,
      playbackId
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Deletes an asset by ID
 */
export async function deleteAsset(assetId: string): Promise<boolean> {
  try {
    await video.assets.delete(assetId);
    return true;
  } catch {
    return false;
  }
}
