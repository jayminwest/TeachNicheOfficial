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
      
      // First check if response is ok before trying to parse
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Try to parse error as JSON, fallback to text if not possible
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(
          errorData.error || errorData.details || 
          `HTTP error! status: ${response.status}`
        );
      }
      
      // Now parse the successful response
      const data = await response.json();
      
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
        
        // For 503 or other retriable errors, continue retrying
        if (response.status === 503 || response.status >= 500) {
          console.log(`Service error (${response.status}), retrying...`);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, options.interval));
          continue;
        }
        
        // For client errors (4xx), fail immediately
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Asset status check failed: ${errorMessage}`);
        }
        
        // For any other errors, retry
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
  if (!Video) {
    throw new Error('Mux Video client not initialized');
  }

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
