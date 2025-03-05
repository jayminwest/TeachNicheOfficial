import { useState, useCallback, useEffect } from 'react';

interface UseVideoUploadOptions {
  endpoint?: string;
  onUploadComplete?: (assetId: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  lessonId?: string;
}

type UploadStatus = 'idle' | 'initializing' | 'ready' | 'uploading' | 'processing' | 'complete' | 'error';

export function useVideoUpload({
  endpoint = '/api/mux/upload',
  onUploadComplete,
  onError,
  onProgress,
  lessonId
}: UseVideoUploadOptions = {}) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadEndpoint, setUploadEndpoint] = useState<string | null>(null);
  
  const initializeUpload = useCallback(async () => {
    setStatus('initializing');
    setProgress(0);
    setError(null);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get upload URL (HTTP ${response.status})`);
      }

      const data = await response.json();
      
      if (!data.url) {
        throw new Error('Invalid upload response: missing URL');
      }
      
      setUploadEndpoint(data.url);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to initialize upload');
      if (onError) onError(error instanceof Error ? error : new Error('Failed to initialize upload'));
    }
  }, [endpoint, onError]);

  const handleUploadStart = useCallback(() => {
    if (!uploadEndpoint) {
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
      setStatus('processing');
      setProgress(80);
      
      // Get the asset ID from the upload
      const response = await fetch(`/api/mux/asset-from-upload?uploadId=${encodeURIComponent(uploadId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      // Get the response text first for better error handling
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error(`Invalid response format: ${responseText.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        const errorMessage = data.error || `Failed to get asset ID: ${response.status}`;
        const errorDetails = data.details ? `: ${data.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }
      
      const assetId = data.assetId;
      
      if (!assetId) {
        console.error('No asset ID in response:', data);
        throw new Error('No asset ID returned from API');
      }
      
      // If we have a lesson ID, update it with the asset ID
      if (lessonId) {
        const updateResponse = await fetch('/api/lessons/update-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            muxAssetId: assetId
          })
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update lesson with asset ID: ${updateResponse.status}`);
        }
      }
      
      // Set status to complete
      setStatus('complete');
      setProgress(100);
      if (onProgress) onProgress(100);
      
      // Call onUploadComplete with the assetId
      if (onUploadComplete) {
        onUploadComplete(assetId);
      }
    } catch (error) {
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to process video upload');
      if (onError) onError(error instanceof Error ? error : new Error('Failed to process video upload'));
    }
  }, [onError, onProgress, onUploadComplete, lessonId]);

  const handleUploadError = useCallback((err: Error) => {
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

  // Initialize on mount
  useEffect(() => {
    if (status === 'idle') {
      initializeUpload();
    }
  }, [status, initializeUpload]);

  return {
    status,
    progress,
    error,
    uploadEndpoint,
    handleUploadStart,
    handleUploadProgress,
    handleUploadSuccess,
    handleUploadError,
    reset,
    initializeUpload
  };
}
