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
  
  // Removed polling logic as we now use webhooks

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
      
      // Generate a timestamp-based ID for this upload
      const localUploadId = `local_${Date.now()}`;
      
      // Store the uploadId globally for later use
      if (data.uploadId) {
        console.log('Storing upload ID for later use:', data.uploadId);
        
        // Store both the Mux upload ID and our local ID
        (window as any).__lastUploadId = data.uploadId;
        (window as any).__localUploadId = localUploadId;
        
        // Also store it as a data attribute in the DOM for fallback
        const uploadIdElement = document.createElement('div');
        uploadIdElement.style.display = 'none';
        uploadIdElement.setAttribute('data-upload-id', data.uploadId);
        uploadIdElement.setAttribute('data-local-id', localUploadId);
        document.body.appendChild(uploadIdElement);
        
        try {
          // Add the upload ID to the URL as a query parameter for easier retrieval
          const url = new URL(data.url);
          url.searchParams.append('upload_id', data.uploadId);
          
          // Also add our local ID as a parameter
          url.searchParams.append('local_id', localUploadId);
          
          return url.toString();
        } catch (e) {
          console.warn('Error adding parameters to URL:', e);
          // If URL parsing fails, just return the original URL
          return data.url;
        }
      } else {
        // If there's no upload ID from Mux, store our local ID
        console.log('No Mux upload ID provided, using local ID:', localUploadId);
        (window as any).__lastUploadId = localUploadId;
        
        try {
          // Try to add our local ID to the URL
          const url = new URL(data.url);
          url.searchParams.append('local_id', localUploadId);
          return url.toString();
        } catch (e) {
          console.warn('Error adding parameters to URL:', e);
          return data.url;
        }
      }
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
      
      // Validate the upload ID
      if (uploadId.startsWith('temp_') || uploadId.startsWith('dummy_') || uploadId.startsWith('local_')) {
        throw new Error(`Invalid upload ID: ${uploadId}. Temporary IDs should not be used.`);
      }
      
      // Get the asset ID from the upload
      let assetId;
      
      try {
        // Use the API endpoint to get the asset ID
        console.log(`Fetching asset ID for upload ${uploadId}`);
        const response = await fetch(`/api/mux/asset-from-upload?uploadId=${encodeURIComponent(uploadId)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Asset ID fetch response status: ${response.status}`);
        
        // Get the response text first for logging
        const responseText = await response.text();
        console.log(`Asset ID fetch response body: ${responseText}`);
        
        // Try to parse the response as JSON
        let errorData;
        try {
          // Parse the text we already got
          errorData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("Error parsing response as JSON:", jsonError);
          console.error("Raw response text:", responseText);
          errorData = { error: "Invalid response format" };
        }
        
        if (!response.ok) {
          // Provide a more detailed error message
          const errorDetails = errorData.details ? `: ${errorData.details}` : '';
          const fullError = `Failed to get asset ID: ${response.status} - ${errorData.error || 'Unknown error'}${errorDetails}`;
          console.error(fullError);
          
          // Include the raw response in the error for debugging
          const enhancedError = new Error(fullError);
          (enhancedError as any).responseData = errorData;
          (enhancedError as any).responseStatus = response.status;
          (enhancedError as any).responseText = responseText;
          
          throw enhancedError;
        }
        
        assetId = errorData.assetId;
        
        if (!assetId) {
          console.error('No asset ID returned from API:', errorData);
          throw new Error('No asset ID returned from API');
        }
        
        // Validate the asset ID
        if (assetId.startsWith('temp_') || assetId.startsWith('dummy_') || assetId.startsWith('local_')) {
          console.error(`Invalid asset ID returned: ${assetId}`);
          throw new Error(`Invalid asset ID returned: ${assetId}`);
        }
        
        console.log("Retrieved assetId:", assetId);
      } catch (error) {
        console.error("Error getting asset ID:", error);
        // Log additional details if available
        if (error instanceof Error && (error as any).responseData) {
          console.error("Response data:", (error as any).responseData);
          console.error("Response status:", (error as any).responseStatus);
          console.error("Response text:", (error as any).responseText);
        }
        throw error; // Propagate the error instead of creating a temporary ID
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
            let errorData;
            try {
              errorData = await updateResponse.json();
            } catch (jsonError) {
              errorData = { error: "Invalid response format" };
            }
            throw new Error(`Failed to update lesson with asset ID: ${updateResponse.status} - ${errorData.error || 'Unknown error'}`);
          }
        } catch (updateError) {
          console.error("Error updating lesson with asset ID:", updateError);
          throw updateError; // Propagate the error
        }
      }
      
      // No need to poll for asset status - webhooks will handle status updates
      console.log("Asset ID stored, webhooks will handle status updates");
      
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
    reset
  };
}
