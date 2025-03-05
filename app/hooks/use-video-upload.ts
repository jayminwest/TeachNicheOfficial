import { useState, useCallback, useEffect } from 'react';

interface UseVideoUploadOptions {
  endpoint?: string;
  onUploadComplete?: (assetId: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  lessonId?: string; // Add this parameter
}

type UploadStatus = 'idle' | 'initializing' | 'ready' | 'uploading' | 'processing' | 'complete' | 'error';

interface UseVideoUploadReturn {
  status: UploadStatus;
  progress: number;
  error: string | null;
  uploadEndpoint: string | null;
  handleUploadStart: () => void;
  handleUploadProgress: (progress: number) => void;
  handleUploadSuccess: (uploadId: string) => Promise<void>;
  handleUploadError: (error: Error) => void;
  reset: () => void;
  pollAssetStatus: (assetId: string, lessonId: string) => Promise<boolean | void>;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    initialDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
    retryCondition?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const { 
    retries = 3, 
    initialDelay = 1000, 
    onRetry = () => {}, 
    retryCondition = () => true 
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retries - 1 || !retryCondition(lastError)) {
        throw lastError;
      }
      
      const delay = initialDelay * Math.pow(1.5, attempt) * (0.75 + Math.random() * 0.5);
      onRetry(attempt + 1, lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw above
  throw new Error("Retry failed");
}

export function useVideoUpload({
  endpoint = '/api/mux/upload',
  onUploadComplete,
  onError,
  onProgress,
  lessonId
}: UseVideoUploadOptions = {}): UseVideoUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadEndpoint, setUploadEndpoint] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const pollAssetStatus = useCallback(async (assetId: string, lessonId: string) => {
    if (!assetId || !lessonId) return;
    
    try {
      console.log(`Starting to poll asset status for asset ${assetId}, lesson ${lessonId}`);
      
      // Poll for asset status
      const result = await fetch(`/api/mux/wait-for-asset?assetId=${encodeURIComponent(assetId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (!res.ok) {
          throw new Error(`Failed to wait for asset: ${res.status}`);
        }
        return res.json();
      });
      
      if (result.status === 'ready' && result.playbackId) {
        console.log(`Asset ${assetId} is ready with playback ID ${result.playbackId}`);
        
        // Update the lesson with the playback ID and set status to published
        const updateResponse = await fetch('/api/lessons/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            muxAssetId: assetId,
            muxPlaybackId: result.playbackId,
            status: 'published'
          })
        });
        
        if (updateResponse.ok) {
          console.log(`Successfully updated lesson ${lessonId} to published status`);
          return true;
        } else {
          console.error(`Failed to update lesson status: ${updateResponse.status}`);
        }
      } else {
        console.warn(`Asset ${assetId} is not ready: ${result.status}`);
      }
    } catch (error) {
      console.error('Error polling asset status:', error);
    }
    
    return false;
  }, []);

  const handleError = useCallback((err: Error) => {
    setStatus('error');
    setError(err.message);
    if (onError) onError(err);
  }, [onError]);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setUploadEndpoint(null);
    setRetryCount(0);
  }, []);

  const getUploadUrl = useCallback(async (): Promise<string> => {
    try {
      // Add a cache-busting parameter to avoid cached responses
      const cacheBuster = `nocache=${Date.now()}`;
      const requestUrl = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${cacheBuster}`;
      
      console.log('Requesting upload URL from:', requestUrl);
      
      // Check if we're in development mode and add a debug parameter
      const isDev = process.env.NODE_ENV === 'development';
      const debugParam = isDev ? '&debug=true' : '';
      
      const response = await fetch(`${requestUrl}${debugParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Ensure we're not using cached responses
        cache: 'no-store'
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to get upload URL (HTTP ${response.status})`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += `: ${errorData.error}`;
            if (errorData.details) {
              errorMessage += ` - ${errorData.details}`;
            }
          }
        } catch {
          // If we can't parse JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += `: ${errorText}`;
            }
          } catch {
            // If we can't get text either, just use the status
            errorMessage += ': No error details available';
          }
        }
        
        console.error('Upload URL error response:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Upload URL response:', data);
      
      if (!data.url) {
        console.error('Invalid upload response:', data);
        throw new Error('Invalid upload response: missing URL');
      }
      
      // Store the uploadId globally for later use
      if (data.uploadId) {
        console.log('Storing upload ID for later use:', data.uploadId);
        
        // Store the upload ID in a global variable for fallback
        (window as any).__lastUploadId = data.uploadId;
        
        // Also store it as a data attribute in the DOM for fallback
        const uploadIdElement = document.createElement('div');
        uploadIdElement.style.display = 'none';
        uploadIdElement.setAttribute('data-upload-id', data.uploadId);
        document.body.appendChild(uploadIdElement);
        
        // Add the upload ID to the URL as a query parameter for easier retrieval
        const url = new URL(data.url);
        url.searchParams.append('upload_id', data.uploadId);
        return url.toString();
      }
      
      return data.url;
    } catch (error) {
      console.error('Upload URL error:', error);
      throw error; // Let the retry mechanism handle it
    }
  }, [endpoint]);

  const initializeUpload = useCallback(async () => {
    // Only initialize if we're in idle state or error state with retries left
    if (status !== 'idle' && !(status === 'error' && retryCount < 3)) return;
    
    setStatus('initializing');
    setProgress(0);
    setError(null);
    
    try {
      const url = await withRetry(
        getUploadUrl,
        {
          retries: 3,
          initialDelay: 1000,
          onRetry: (attempt) => {
            setRetryCount(attempt);
            // Don't set this as an error, use a separate state for status messages
            console.log(`Preparing upload (attempt ${attempt})...`);
          }
        }
      );
      
      setUploadEndpoint(url);
      setStatus('ready'); // Set to 'ready' when URL is obtained
    } catch (error) {
      console.error('Failed to initialize upload:', error);
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to initialize upload');
      if (onError) onError(error instanceof Error ? error : new Error('Failed to initialize upload'));
    }
  }, [getUploadUrl, onError, status, retryCount]);

  const handleUploadStart = useCallback(() => {
    // Only start upload if we have an endpoint
    if (!uploadEndpoint) {
      // If no endpoint, initialize first
      initializeUpload();
      return;
    }
    
    setStatus('uploading');
    setProgress(0);
    setError(null);
  }, [uploadEndpoint, initializeUpload]);

  const handleUploadProgress = useCallback((value: number) => {
    setProgress(value);
    if (onProgress) onProgress(value);
  }, [onProgress]);

  const handleUploadSuccess = useCallback(async (uploadId: string) => {
    try {
      if (!uploadId) {
        console.error("handleUploadSuccess called with empty uploadId");
        throw new Error("No upload ID provided");
      }
      
      console.log("Processing upload success for ID:", uploadId);
      setStatus('processing');
      setProgress(80); // Set progress to indicate processing has started
      
      // Get the asset ID from the upload
      let assetId;
      
      // Check if we're dealing with a temporary ID
      if (uploadId.startsWith('temp_')) {
        console.log("Using temporary ID as asset ID:", uploadId);
        assetId = uploadId;
      } else {
        try {
          // Use the new API endpoint to get the asset ID
          assetId = await fetch(`/api/mux/asset-from-upload?uploadId=${encodeURIComponent(uploadId)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(res => {
            if (!res.ok) {
              throw new Error(`Failed to get asset ID: ${res.status}`);
            }
            return res.json();
          }).then(data => data.assetId);
          
          if (!assetId) {
            console.warn('No asset ID returned from API, using upload ID as fallback');
            assetId = uploadId;
          }
          
          console.log("Retrieved assetId:", assetId);
        } catch (error) {
          console.error("Error getting asset ID:", error);
          console.log("Using upload ID as fallback asset ID");
          assetId = uploadId;
        }
      }
      
      // If we have a lesson ID, update it with the asset ID
      if (lessonId) {
        try {
          const updateResponse = await fetch('/api/lessons/update-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonId,
              muxAssetId: assetId
            })
          });
          
          if (!updateResponse.ok) {
            console.warn(`Failed to update lesson with asset ID: ${updateResponse.status}`);
            // Continue anyway - we'll start polling for the asset status
          }
        } catch (updateError) {
          console.warn("Error updating lesson with asset ID:", updateError);
          // Continue anyway - we'll start polling for the asset status
        }
      }
      
      // Start polling for asset status in the background
      if (lessonId) {
        pollAssetStatus(assetId, lessonId)
          .catch(error => console.error("Error polling asset status:", error));
      }
      
      // Set status to complete
      setStatus('complete');
      setProgress(100);
      if (onProgress) onProgress(100);
      
      // Call onUploadComplete with the assetId
      if (onUploadComplete) {
        console.log("Calling onUploadComplete with assetId:", assetId);
        onUploadComplete(assetId);
      } else {
        console.warn("onUploadComplete callback is not defined");
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to process video upload'));
    }
  }, [handleError, onProgress, onUploadComplete, lessonId, pollAssetStatus]);

  // Add an effect to automatically initialize on mount
  useEffect(() => {
    // Auto-initialize on mount if in idle state
    if (status === 'idle') {
      initializeUpload();
    }
  }, [initializeUpload, status]);

  return {
    status,
    progress,
    error,
    uploadEndpoint,
    initializeUpload,
    handleUploadStart,
    handleUploadProgress,
    handleUploadSuccess,
    handleUploadError: handleError,
    reset,
    pollAssetStatus
  };
}
