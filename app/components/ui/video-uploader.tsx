"use client";

import { cn } from "@/app/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";
import { AlertCircle, CheckCircle2, Upload, Loader2 } from "lucide-react";
import MuxUploader from "@mux/mux-uploader-react";
import { useVideoUpload } from "@/app/hooks/use-video-upload";


interface VideoUploaderProps {
  endpoint?: string;
  onUploadComplete: (assetId: string) => void;
  onError: (error: Error) => void;
  onUploadStart?: () => void;
  maxSizeMB?: number;
  maxResolution?: { width: number; height: number };
  acceptedTypes?: string[];
  className?: string;
  pausable?: boolean;
  noDrop?: boolean;
  chunkSize?: number;
  dynamicChunkSize?: boolean;
  useLargeFileWorkaround?: boolean;
}

import type { MuxUploaderProps } from "@mux/mux-uploader-react";

export function VideoUploader({ 
  onUploadComplete, 
  onError,
  onUploadStart,
  maxSizeMB = 2000,
  maxResolution = { width: 1920, height: 1080 },
  acceptedTypes = ['video/mp4', 'video/quicktime', 'video/heic', 'video/heif'],
  className,
  pausable = false,
  noDrop = false,
  chunkSize,
  dynamicChunkSize = false,
  useLargeFileWorkaround = false
}: VideoUploaderProps) {
  const getVideoResolution = (file: File): Promise<{width: number; height: number}> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          width: video.videoWidth,
          height: video.videoHeight
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const validateFile = async (file: File) => {
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

    // Check video resolution
    if (file.type.startsWith('video/')) {
      const videoResolution = await getVideoResolution(file);
      if (videoResolution.width > maxResolution.width || 
          videoResolution.height > maxResolution.height) {
        throw new Error(`Video resolution must not exceed ${maxResolution.width}x${maxResolution.height} (1080p)`);
      }
    }
  };
  
  const {
    status,
    progress,
    error: errorMessage,
    uploadEndpoint,
    handleUploadStart: startUpload,
    handleUploadProgress,
    handleUploadSuccess,
    handleUploadError,
  } = useVideoUpload({
    onUploadComplete,
    onError,
    onProgress: (progress) => {
      if (progress === 100) {
        onUploadStart?.();
      }
    }
  });
  
  const handleUploadStart: MuxUploaderProps["onUploadStart"] = (event) => {
    const file = event.detail?.file;

    if (!file) {
      handleUploadError(new Error("No file selected"));
      return;
    }
    
    if (!uploadEndpoint) {
      handleUploadError(new Error("Upload URL not available. Please try again."));
      return;
    }
    
    try {
      validateFile(file);
      startUpload();
      if (typeof onUploadStart === "function") {
        onUploadStart();
      }
    } catch (error) {
      handleUploadError(error instanceof Error ? error : new Error("Invalid file"));
    }
  };

  // Handle progress events from MuxUploader
  const handleProgress = (event: unknown) => {
    // Check if it's a CustomEvent with detail
    if (event instanceof CustomEvent && event.detail !== undefined) {
      handleUploadProgress(event.detail);
    }
  };

  // Wait for the uploadEndpoint to be resolved before rendering the uploader
  if (!uploadEndpoint) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Preparing upload...</span>
      </div>
    );
  }

  return (
    <div className={cn("relative space-y-4", className)}>
      <MuxUploader
        className="mux-uploader"
        endpoint={uploadEndpoint}
        onUploadStart={handleUploadStart}
        onProgress={handleProgress}
        onSuccess={(event) => {
          if (event instanceof CustomEvent && typeof event.detail === 'object' && event.detail && 'uploadId' in event.detail) {
            // @ts-expect-error - We've already checked that uploadId exists in event.detail
            handleUploadSuccess(event.detail.uploadId);
          }
        }}
        onError={(event) => {
          if (event instanceof CustomEvent && event.detail) {
            const error = event.detail;
            handleUploadError(error instanceof Error ? error : new Error(String(error)));
          } else {
            handleUploadError(new Error("Upload failed"));
          }
        }}
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
        Accepted formats: {acceptedTypes.join(', ')} (max {maxSizeMB}MB, max resolution 1080p)
      </p>
    </div>
  );
}
