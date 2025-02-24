"use client";

import { cn } from "@/app/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { Button } from "./button";
import { Progress } from "./progress";
import { AlertCircle, CheckCircle2, Upload, Loader2 } from "lucide-react";
import MuxUploader from "@mux/mux-uploader-react";


interface VideoUploaderProps {
  endpoint?: string;
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

export function VideoUploader({ 
  endpoint,
  onUploadComplete, 
  onError,
  onUploadStart,
  maxSizeMB = 500,
  acceptedTypes = ['video/mp4', 'video/quicktime', 'video/heic', 'video/heif'],
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
    console.log('Validating file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });

    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check both MIME type and file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = acceptedTypes.includes(file.type) || 
                       (fileExtension && ['heic', 'heif'].includes(fileExtension));

    if (!isValidType) {
      throw new Error(`File type must be one of: ${acceptedTypes.join(', ')} or HEIC/HEIF format`);
    }
  };

  const [uploadEndpoint, setUploadEndpoint] = useState<string | null>(null);
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);

  // First step: Get the Mux upload URL from our API
  const getUploadUrl = useCallback(async (): Promise<{url: string; assetId: string}> => {
    const response = await fetch('/api/mux/upload', {
      method: 'POST'
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      throw new Error(
        `Failed to get upload URL (HTTP ${response.status}): ${errorText}`
      );
    }

    const data = await response.json();
    if (!data.url || !data.assetId) {
      throw new Error('Invalid upload response');
    }
    return data;
  }, []);

  // Fetch endpoint URL when component mounts if it's a function
  useEffect(() => {
    const fetchWithRetry = async (retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const {url, assetId} = await getUploadUrl();
          setUploadEndpoint(url);
          setCurrentAssetId(assetId);
          return;
        } catch (error) {
          console.error(`Upload URL fetch attempt ${i + 1} failed:`, error);
          if (i === retries - 1) {
            handleError(error instanceof Error ? error : new Error('Failed to get upload URL'));
            return;
          }
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    };

    fetchWithRetry();
  }, [endpoint, getUploadUrl, handleError]);

  const handleUploadStart: MuxUploaderProps["onUploadStart"] = (event) => {
    const file = event.detail?.file;
    console.log("Upload start event:", {
      file: file ? {
        name: file.name,
        size: file.size,
        type: file.type
      } : null,
      uploadEndpoint
    });

    if (!file) {
      handleError(new Error("No file selected"));
      return;
    }
    if (!uploadEndpoint) {
      handleError(new Error("Upload URL not available. Please try again."));
      return;
    }
    try {
      validateFile(file);
      setStatus("uploading");
      setProgress(0);
      setErrorMessage("");
      if (typeof onUploadStart === "function") {
        onUploadStart();
      }
      console.log("Upload started successfully");
    } catch (error) {
      console.error("Upload start error:", error);
      handleError(error instanceof Error ? error : new Error("Invalid file"));
    }
  };

  const handleProgress: MuxUploaderProps["onProgress"] = (event) => {
    if (event instanceof CustomEvent) {
      const progressValue = event.detail;
      console.log("Upload progress:", progressValue);
      setProgress(progressValue);
    }
  };

  const handleSuccess: MuxUploaderProps["onSuccess"] = async (event) => {
    console.log("Raw success event:", event);
    
    if (!currentAssetId) {
      console.error("No asset ID available for completed upload");
      handleError(new Error("Upload failed: No asset ID available"));
      return;
    }

    try {
      setStatus("processing");
      
      // Get the upload status to get the asset ID
      const uploadResponse = await fetch(`/api/video/upload-status?uploadId=${currentAssetId}`);
      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload status');
      }
      
      const uploadData = await uploadResponse.json();
      if (!uploadData.asset_id) {
        throw new Error('No asset ID in upload response');
      }

      // Wait for the asset to be ready
      const assetResponse = await fetch(`/api/mux/asset-status?assetId=${uploadData.asset_id}`);
      if (!assetResponse.ok) {
        throw new Error('Failed to get asset status');
      }

      const assetData = await assetResponse.json();
      if (assetData.status === 'errored') {
        throw new Error('Video processing failed');
      }

      if (!assetData.playbackId) {
        throw new Error('No playback ID available');
      }

      console.log("Upload and processing completed successfully:", {
        uploadId: currentAssetId,
        assetId: uploadData.asset_id,
        status: assetData.status,
        playbackId: assetData.playbackId
      });

      setStatus("ready");
      onUploadComplete(uploadData.asset_id);
    } catch (error) {
      console.error("Error getting asset ID from upload:", error);
      handleError(error instanceof Error ? error : new Error('Failed to get asset ID'));
    }
  };

  const handleUploadError: MuxUploaderProps["onError"] = (event) => {
    if (event instanceof CustomEvent) {
      const error = event.detail;
      console.error("Upload error (CustomEvent):", {
        error,
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      handleError(error);
    } else {
      console.error("Upload error (unknown type):", {
        event,
        type: typeof event,
        toString: String(event)
      });
      handleError(new Error("Upload failed"));
    }
  };

  // Wait for the uploadEndpoint to be resolved before rendering the uploader
  if (!uploadEndpoint) {
    return <div>Loading upload URL...</div>;
  }

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
        {status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
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
