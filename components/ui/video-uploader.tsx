"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { Button } from "./button";
import { Progress } from "./progress";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import MuxUploader from "@mux/mux-uploader-react";


interface VideoUploaderProps {
  endpoint: string | (() => Promise<string>);
  onUploadComplete: (assetId: string) => void;
  onError: (error: Error) => void;
  onUploadStart?: () => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  pausable?: boolean;
  noDrop?: boolean;
  chunkSize?: number;
  dynamicChunkSize?: boolean;
  useLargeFileWorkaround?: boolean;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

import type { MuxUploaderProps } from "@mux/mux-uploader-react";

// Event handler types for MuxUploader
type MuxUploadStartHandler = MuxUploaderProps["onUploadStart"];
type MuxUploadProgressHandler = MuxUploaderProps["onProgress"]; 
type MuxUploadSuccessHandler = MuxUploaderProps["onSuccess"];
type MuxUploadErrorHandler = MuxUploaderProps["onError"];

export function VideoUploader({ 
  endpoint,
  onUploadComplete, 
  onError,
  maxSizeMB = 500,
  acceptedTypes = ['video/mp4', 'video/quicktime'],
  className,
  pausable = false,
  noDrop = false,
  chunkSize,
  dynamicChunkSize = false,
  useLargeFileWorkaround = false
}: VideoUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleError = useCallback((error: Error): void => {
    setStatus('error');
    setErrorMessage(error.message);
    onError(error);
  }, [onError]);

  const validateFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`File type must be one of: ${acceptedTypes.join(', ')}`);
    }
  };

  const [uploadEndpoint, setUploadEndpoint] = useState<string | undefined>();

  // First step: Get the Mux upload URL from our API
  const getUploadUrl = useCallback(async (): Promise<string> => {
    const response = await fetch(typeof endpoint === 'string' ? endpoint : await endpoint(), {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    const data = await response.json();
    return data.url;
  }, [endpoint]);

  // Fetch endpoint URL when component mounts if it's a function
  useEffect(() => {
    getUploadUrl()
      .then(setUploadEndpoint)
      .catch(error => {
        console.error('Failed to get upload URL:', error);
        handleError(new Error('Failed to get upload URL'));
      });
  }, [endpoint, getUploadUrl, handleError]);

  const handleUploadStart: MuxUploadStartHandler = async (event) => {
    try {
      if (!event.detail?.file) {
        throw new Error('No file selected');
      }

      if (!uploadEndpoint) {
        throw new Error('Upload URL not available. Please try again.');
      }
      
      console.log('handleUploadStart called with endpoint:', uploadEndpoint);
      
      validateFile(event.detail.file);
      
      setStatus('uploading');
      setProgress(0);
      setErrorMessage('');
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Invalid file'));
    }
  };

  const handleProgress: MuxUploadProgressHandler = (event) => {
    if (typeof event === 'number') {
      setProgress(event);
    } else if (event instanceof CustomEvent) {
      setProgress(event.detail);
    }
  };

  const handleSuccess: MuxUploadSuccessHandler = (event) => {
    console.log('Upload success event:', event);
    
    if (event instanceof CustomEvent && event.detail) {
      // Handle event with detail data
      const { status, assetId } = event.detail;
      console.log('Detail event - Status:', status, 'Asset ID:', assetId);
      
      if (status === 'complete' && assetId) {
        setStatus('ready');
        onUploadComplete(assetId);
      } else if (status === 'processing') {
        setStatus('processing');
      }
    } else {
      // This is the initial success event, indicating upload is complete
      console.log('Initial success event - upload complete');
      setStatus('processing');
      
      // Extract asset ID from the upload URL
      const url = new URL(uploadEndpoint || '');
      const uploadId = url.searchParams.get('upload_id');
      if (uploadId) {
        console.log('Found upload ID:', uploadId);
        // Use upload ID as temporary asset ID
        onUploadComplete(uploadId);
        setStatus('ready');
      }
    }
    console.log('Detail event - Status:', status, 'Asset ID:', assetId);
    
    if (status === 'complete' && assetId) {
      setStatus('ready');
      onUploadComplete(assetId);
    } else if (status === 'processing') {
      setStatus('processing');
    } else {
      console.log('Unexpected status:', status);
    }
  };

  const handleUploadError: MuxUploadErrorHandler = (error) => {
    console.error('Upload error:', error);
    handleError(error);
  };

  console.log('Current uploadEndpoint:', uploadEndpoint);
  console.log('Current status:', status);

  return (
    <div className={cn("relative space-y-4", className)}>
      <MuxUploader
        className="mux-uploader"
        endpoint={uploadEndpoint}
        onUploadStart={handleUploadStart}
        onProgress={handleProgress}
        onSuccess={handleSuccess}
        onError={handleUploadError}
        pausable={pausable}
        noDrop={noDrop}
        maxFileSize={maxSizeMB ? maxSizeMB * 1024 * 1024 : undefined}
        chunkSize={chunkSize}
        dynamicChunkSize={dynamicChunkSize}
        useLargeFileWorkaround={useLargeFileWorkaround}
        accept={acceptedTypes.join(',')}
        multiple={false}
      >
        {status === 'idle' && (
          <Button type="button" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Video
          </Button>
        )}
      </MuxUploader>

      {status !== 'idle' && (
        <Progress value={progress} className="w-full" />
      )}

      <div className="flex items-center gap-2 text-sm">
        {status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
        {status === 'ready' && <CheckCircle2 className="h-4 w-4 text-primary" />}
        <p className="text-muted-foreground">
          {status === 'uploading' && `Uploading... ${progress}%`}
          {status === 'processing' && 'Processing video...'}
          {status === 'ready' && 'Upload complete!'}
          {status === 'error' && (errorMessage || 'Upload failed. Please try again.')}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Accepted formats: {acceptedTypes.join(', ')} (max {maxSizeMB}MB)
      </p>
    </div>
  );
}
