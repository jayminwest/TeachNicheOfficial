import { useState, useCallback } from 'react';

interface UseVideoUploadOptions {
  onUploadComplete?: (assetId: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

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
  onUploadComplete,
  onError,
  onProgress
}: UseVideoUploadOptions = {}): UseVideoUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadEndpoint, setUploadEndpoint] = useState<string | null>(null);

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
  }, []);

  const getUploadUrl = useCallback(async (): Promise<string> => {
    const response = await fetch('/api/mux/upload', {
      method: 'POST'
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      throw new Error(`Failed to get upload URL (HTTP ${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.url || !data.uploadId) {
      throw new Error('Invalid upload response: missing URL or upload ID');
    }
    
    return data.url;
  }, []);

  const handleUploadStart = useCallback(() => {
    setStatus('uploading');
    setProgress(0);
    setError(null);
    
    withRetry(
      getUploadUrl,
      {
        retries: 3,
        initialDelay: 1000,
        onRetry: (attempt) => {
          setError(`Preparing upload (attempt ${attempt})...`);
        }
      }
    )
      .then((url) => {
        setUploadEndpoint(url);
        setError(null);
      })
      .catch(handleError);
  }, [getUploadUrl, handleError]);

  const handleUploadProgress = useCallback((value: number) => {
    setProgress(value);
    if (onProgress) onProgress(value);
  }, [onProgress]);

  const handleUploadSuccess = useCallback(async (uploadId: string) => {
    try {
      setStatus('processing');
      
      // Get the asset ID from the upload
      const assetId = await withRetry(
        async () => {
          const response = await fetch(`/api/mux/upload-status?uploadId=${encodeURIComponent(uploadId)}`);
          
          if (!response.ok) {
            throw new Error(`Failed to get upload status: ${response.status}`);
          }
          
          const data = await response.json();
          
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
      
      // Check asset status
      await withRetry(
        async () => {
          const response = await fetch(`/api/mux/asset-status?assetId=${encodeURIComponent(assetId)}`);
          
          if (!response.ok) {
            throw new Error(`Failed to get asset status: ${response.status}`);
          }
          
          const data = await response.json();
          
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

      setStatus('ready');
      setProgress(100);
      if (onProgress) onProgress(100);
      if (onUploadComplete) onUploadComplete(assetId);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to process video upload'));
    }
  }, [handleError, onProgress, onUploadComplete]);

  return {
    status,
    progress,
    error,
    uploadEndpoint,
    handleUploadStart,
    handleUploadProgress,
    handleUploadSuccess,
    handleUploadError: handleError,
    reset
  };
}
