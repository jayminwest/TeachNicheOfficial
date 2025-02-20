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

export function VideoUploader({ 
  endpoint,
  onUploadComplete, 
  onError,
  onUploadStart,
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

  const [uploadEndpoint, setUploadEndpoint] = useState<string | null>(null);

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

  const handleSuccess: MuxUploaderProps["onSuccess"] = (event) => {
    console.log("Raw success event:", event);
    
    if (!event.detail) {
      console.warn("Success event missing detail:", {
        event,
        eventType: event instanceof CustomEvent ? 'CustomEvent' : typeof event,
        eventKeys: Object.keys(event)
      });
      return;
    }
    const { status: uploadStatus, assetId } = event.detail;
    console.log("Upload success event:", {
      detail: event.detail,
      status: uploadStatus,
      assetId: assetId
    });

    if (uploadStatus === "complete" && assetId) {
      console.log("Upload completed successfully with assetId:", assetId);
      setStatus("ready");
      onUploadComplete(assetId);
    } else if (uploadStatus === "processing") {
      console.log("Upload is processing");
      setStatus("processing");
    } else {
      console.warn("Unexpected upload status:", {
        status: uploadStatus,
        assetId: assetId,
        fullEvent: event
      });
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
