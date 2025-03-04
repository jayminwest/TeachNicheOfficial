import { useState, useCallback, useEffect } from 'react';

interface UseVideoUploadOptions {
  endpoint?: string;
  onUploadComplete?: (assetId: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
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
  onProgress
}: UseVideoUploadOptions = {}): UseVideoUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadEndpoint, setUploadEndpoint] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
        // Store the upload ID in a global variable for fallback
        (window as any).__lastUploadId = data.uploadId;
        
        // Also store it as a data attribute in the DOM for fallback
        const uploadIdElement = document.createElement('div');
        uploadIdElement.style.display = 'none';
        uploadIdElement.setAttribute('data-upload-id', data.uploadId);
        document.body.appendChild(uploadIdElement);
        
        // Don't modify the URL - just return it as is
        return data.url;
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
      
      // Clean up the uploadId if it's a full URL or contains extra characters
      let cleanUploadId = uploadId;
      
      // If it's suspiciously long (over 100 chars), it might be a full URL or have extra data
      if (uploadId.length > 100) {
        console.warn("Upload ID is suspiciously long, attempting to clean it up");
        
        // Try to extract just the ID part
        const idMatch = uploadId.match(/([a-zA-Z0-9_-]{10,64})/);
        if (idMatch && idMatch[1]) {
          cleanUploadId = idMatch[1];
          console.log("Extracted cleaner upload ID:", cleanUploadId);
        } else {
          // If we can't extract a clean ID, use the global fallback
          cleanUploadId = (window as any).__lastUploadId || uploadId;
          console.log("Using global fallback upload ID:", cleanUploadId);
        }
      }
      
      console.log("Processing upload success for ID:", cleanUploadId);
      setStatus('processing');
      
      // Get the asset ID from the upload
      const assetId = await withRetry(
        async () => {
          console.log(`Fetching asset ID for upload: ${cleanUploadId}`);
          
          // Instead of checking upload status, we'll directly check if the asset was created
          // This is more reliable since the upload might have already completed
          const response = await fetch(`/api/mux/asset-by-upload?uploadId=${encodeURIComponent(cleanUploadId)}`);
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => "No error details");
            console.error(`Asset check error (${response.status}):`, errorText);
            throw new Error(`Failed to get asset for upload: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Asset check response:", data);
          
          if (!data.assetId) {
            throw new Error("No asset ID available from upload");
          }
          
          return data.assetId;
        },
        {
          retries: 3,
          initialDelay: 2000,
          onRetry: (attempt) => {
            setProgress(Math.min(95, 80 + attempt * 5));
            if (onProgress) onProgress(Math.min(95, 80 + attempt * 5));
          }
        }
      );
      
      console.log("Retrieved assetId:", assetId); // Add debug log
      
      // Check asset status
      const assetData = await withRetry(
        async () => {
          const response = await fetch(`/api/mux/asset-status?assetId=${encodeURIComponent(assetId)}`);
          
          if (!response.ok) {
            throw new Error(`Failed to get asset status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Asset status response:", data); // Add debug log
          
          if (data.status === 'errored') {
            throw new Error('Video processing failed');
          }
          
          if (!data.playbackId) {
            throw new Error('No playback ID available');
          }
          
          return data;
        },
        {
          retries: 3,
          initialDelay: 2000,
          onRetry: (attempt) => {
            setProgress(Math.min(99, 95 + attempt));
            if (onProgress) onProgress(Math.min(99, 95 + attempt));
          }
        }
      );

      setStatus('complete');
      setProgress(100);
      if (onProgress) onProgress(100);
      
      // IMPORTANT: Call onUploadComplete with the assetId
      if (onUploadComplete) {
        console.log("Calling onUploadComplete with assetId:", assetId);
        onUploadComplete(assetId);
      } else {
        console.warn("onUploadComplete callback is not defined");
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to process video upload'));
    }
  }, [handleError, onProgress, onUploadComplete]);

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
    reset
  };
}
