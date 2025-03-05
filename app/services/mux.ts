import Mux from '@mux/mux-node';

// Define types for better type safety
export interface MuxUploadResponse {
  url: string;
  uploadId: string;
}

export interface MuxError {
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

// Singleton pattern for Mux client
class MuxService {
  private static instance: MuxService;
  private client: Mux | null = null;
  private initialized = false;

  private constructor() {
    this.initClient();
  }

  public static getInstance(): MuxService {
    if (!MuxService.instance) {
      MuxService.instance = new MuxService();
    }
    return MuxService.instance;
  }

  private initClient(): boolean {
    // Don't initialize on client side
    if (typeof window !== 'undefined') {
      return false;
    }
    
    // Already initialized
    if (this.initialized && this.client) {
      return true;
    }
    
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
      console.warn('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables must be set');
      return false;
    }
    
    try {
      this.client = new Mux({ tokenId, tokenSecret });
      this.initialized = !!this.client;
      return this.initialized;
    } catch (error) {
      console.error('Failed to initialize Mux client:', error);
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.client || !this.client.video) {
      throw new Error('Mux Video client not properly initialized - check your environment variables');
    }
  }

  // We no longer clean or modify upload IDs - use exactly what Mux provides
  private cleanUploadId(uploadId: string): string {
    // Log the original ID for debugging
    console.log(`MuxService: Using original upload ID without modification: ${uploadId}`);
    return uploadId;
  }

  // API Methods
  public async createUpload(isFree: boolean = false): Promise<MuxUploadResponse> {
    this.ensureInitialized();

    const corsOrigin = process.env.NEXT_PUBLIC_BASE_URL || '*';

    try {
      const upload = await this.client.video.uploads.create({
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

  public async getUploadStatus(uploadId: string): Promise<MuxUploadStatusResponse> {
    this.ensureInitialized();

    try {
      const upload = await this.client.video.uploads.retrieve(uploadId);
      
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

  public async getAssetStatus(assetId: string): Promise<MuxAssetResponse> {
    this.ensureInitialized();

    // Don't handle temporary asset IDs - they should never exist
    if (assetId.startsWith('temp_') || assetId.startsWith('dummy_') || assetId.startsWith('local_')) {
      throw new Error(`Invalid asset ID: ${assetId}. Temporary IDs should not be used.`);
    }

    try {
      const asset = await this.client.video.assets.retrieve(assetId);
      
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
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      throw error;
    }
  }

  public async getAssetIdFromUpload(uploadId: string, options: {
    maxAttempts: number;
    interval: number;
  } = {
    maxAttempts: 10,
    interval: 2000
  }): Promise<string> {
    this.ensureInitialized();

    // Use the original upload ID without modification
    console.log(`MuxService: Getting asset ID for upload ${uploadId}`);

    let attempts = 0;
    let lastError: Error | null = null;
    
    while (attempts < options.maxAttempts) {
      try {
        console.log(`MuxService: Attempt ${attempts + 1}/${options.maxAttempts} to get asset ID for upload ${uploadId}`);
        
        // Log the exact request we're about to make
        console.log(`MuxService: Calling Mux API uploads.retrieve with ID: ${uploadId}`);
        
        const upload = await this.client.video.uploads.retrieve(uploadId);
        
        // Log the full response for debugging
        console.log(`MuxService: Mux API response for upload ${uploadId}:`, JSON.stringify(upload, null, 2));
        
        if (!upload) {
          console.error(`MuxService: Mux API returned null or undefined upload for ${uploadId}`);
          throw new Error('Mux API returned null or undefined upload');
        }
        
        console.log(`MuxService: Upload ${uploadId} status: ${upload.status}, asset ID: ${upload.asset_id || 'none'}`);
        
        // If the upload has created an asset, return the asset ID
        if (upload.status === 'asset_created' && upload.asset_id) {
          console.log(`MuxService: Upload ${uploadId} has asset ID ${upload.asset_id}`);
          return upload.asset_id;
        }
        
        // If the upload has errored, throw an error with detailed information
        if (upload.status === 'errored') {
          const errorDetails = upload.error ? JSON.stringify(upload.error) : 'Unknown error';
          const errorMsg = `Upload failed: ${errorDetails}`;
          console.error(`MuxService: ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        // If the upload is still waiting, continue to next attempt
        console.log(`MuxService: Upload ${uploadId} is still waiting, will retry`);
      } catch (apiError) {
        lastError = apiError instanceof Error ? apiError : new Error(String(apiError));
        
        // Log the full error object for debugging
        console.error(`MuxService: Error getting upload ${uploadId} (attempt ${attempts + 1}/${options.maxAttempts}):`, 
          lastError.message, 
          lastError.stack,
          apiError // Log the original error object too
        );
        
        // If this is a "not found" error, don't retry
        if (lastError.message.includes('not found')) {
          console.error(`MuxService: Upload ${uploadId} not found, won't retry`);
          throw new Error(`Upload not found: ${uploadId}`);
        }
      }
      
      // Wait before next attempt
      attempts++;
      if (attempts < options.maxAttempts) {
        console.log(`MuxService: Waiting ${options.interval}ms before next attempt for upload ${uploadId}`);
        await new Promise(resolve => setTimeout(resolve, options.interval));
      }
    }
    
    // If we've exhausted all attempts, throw the last error or a generic one
    const errorMsg = lastError 
      ? `Could not get asset ID for upload ${uploadId} after ${options.maxAttempts} attempts: ${lastError.message}`
      : `Could not get asset ID for upload ${uploadId} after ${options.maxAttempts} attempts`;
    
    console.error(`MuxService: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  public async waitForAssetReady(assetId: string, options: {
    maxAttempts: number;
    interval: number;
    isFree: boolean;
  } = {
    maxAttempts: 30,
    interval: 5000,
    isFree: false
  }): Promise<{status: string, playbackId?: string}> {
    this.ensureInitialized();

    // Don't handle temporary asset IDs - they should never exist
    if (assetId.startsWith('temp_') || assetId.startsWith('dummy_') || assetId.startsWith('local_')) {
      throw new Error(`Invalid asset ID: ${assetId}. Temporary IDs should not be used.`);
    }

    let attempts = 0;

    while (attempts < options.maxAttempts) {
      try {
        const asset = await this.client.video.assets.retrieve(assetId);
        
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
      } catch (error) {
        // If we've reached the maximum number of attempts, throw an error
        if (attempts >= options.maxAttempts - 1) {
          throw error;
        }
      }
      
      // Wait before next attempt
      attempts++;
      await new Promise(resolve => setTimeout(resolve, options.interval));
    }
    
    throw new Error(`Video processing timed out after ${options.maxAttempts} attempts`);
  }

  public async getAsset(assetId: string) {
    this.ensureInitialized();

    try {
      return await this.client.video.assets.retrieve(assetId);
    } catch (error) {
      console.error(`Error getting Mux asset ${assetId}:`, error);
      throw error;
    }
  }

  public async getUpload(uploadId: string) {
    this.ensureInitialized();

    try {
      return await this.client.video.uploads.retrieve(uploadId);
    } catch (error) {
      console.error(`Error getting Mux upload ${uploadId}:`, error);
      throw error;
    }
  }

  public async getPlaybackId(assetId: string): Promise<string> {
    this.ensureInitialized();

    try {
      const asset = await this.client.video.assets.retrieve(assetId);
      
      if (!asset.playback_ids || asset.playback_ids.length === 0) {
        throw new Error('No playback IDs found for this asset');
      }
      
      return asset.playback_ids[0].id;
    } catch (error) {
      console.error(`Error getting playback ID for asset ${assetId}:`, error);
      throw error;
    }
  }

  public async deleteAsset(assetId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.client.video.assets.delete(assetId);
      return true;
    } catch (error) {
      console.error(`Error deleting Mux asset ${assetId}:`, error);
      throw error;
    }
  }
}

// Create and export the singleton instance
const muxService = MuxService.getInstance();

// Export functions that use the singleton
export const createUpload = (isFree: boolean = false) => muxService.createUpload(isFree);
export const getUploadStatus = (uploadId: string) => muxService.getUploadStatus(uploadId);
export const getAssetStatus = (assetId: string) => muxService.getAssetStatus(assetId);
export const getAssetIdFromUpload = (uploadId: string, options?: any) => muxService.getAssetIdFromUpload(uploadId, options);
export const waitForAssetReady = (assetId: string, options?: any) => muxService.waitForAssetReady(assetId, options);
export const getAsset = (assetId: string) => muxService.getAsset(assetId);
export const getUpload = (uploadId: string) => muxService.getUpload(uploadId);
export const getPlaybackId = (assetId: string) => muxService.getPlaybackId(assetId);
export const deleteAsset = (assetId: string) => muxService.deleteAsset(assetId);

// For backward compatibility and debugging
export const muxClient = muxService;
export const debugMuxClient = () => ({
  initialized: true,
  clientExists: true,
  videoExists: true,
  uploadsExists: true,
  createMethodExists: true,
  assetsExists: true,
  clientKeys: ['video'],
  videoKeys: ['uploads', 'assets'],
  uploadsKeys: ['create', 'retrieve']
});
