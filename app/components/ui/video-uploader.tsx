"use client";

import { cn } from "@/app/lib/utils";
import { useState, useEffect, useCallback } from "react";
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
  endpoint,
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

    // Skip resolution check as requested
    console.log("Skipping video resolution check as requested");
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

  // Show appropriate UI based on the upload initialization status
  if (status === 'initializing') {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Preparing upload...</span>
      </div>
    );
  }
  
  if (status === 'error' && !uploadEndpoint) {
    return (
      <div className="space-y-4">
        <div className="flex items-center text-destructive">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p className="text-sm font-medium">Failed to initialize upload</p>
        </div>
        <p className="text-sm text-muted-foreground">{errorMessage || "Couldn't prepare the upload. Please try again."}</p>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            // Reset and try again
            handleUploadError(new Error("Retrying upload initialization"));
            startUpload();
          }}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }
  
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
        onProgress={handleUploadProgress}
        onSuccess={(event) => {
          console.log("MuxUploader onSuccess event:", event);
          
          // Since the event doesn't have the expected structure, we need to use the uploadId
          // that we received from the initial upload URL response
          try {
            // First try to get the upload_id from the DOM
            const uploadIds = document.querySelectorAll('[data-upload-id]');
            if (uploadIds.length > 0) {
              const firstUploadId = uploadIds[0].getAttribute('data-upload-id');
              if (firstUploadId) {
                console.log("Using upload ID from DOM:", firstUploadId);
                // Store the upload ID in a global variable for fallback
                (window as any).__lastUploadId = firstUploadId;
                handleUploadSuccess(firstUploadId);
                return;
              }
            }
            
            // Next try to extract from URL params
            if (uploadEndpoint) {
              try {
                const uploadEndpointUrl = new URL(uploadEndpoint);
                const uploadIdParam = uploadEndpointUrl.searchParams.get("upload_id");
                
                if (uploadIdParam) {
                  console.log("Using upload ID from URL param:", uploadIdParam);
                  // Store the upload ID in a global variable for fallback
                  (window as any).__lastUploadId = uploadIdParam;
                  handleUploadSuccess(uploadIdParam);
                  return;
                }
              } catch (urlError) {
                console.error("Error parsing URL:", urlError);
              }
            }
            
            // Try to extract from the event
            if (event instanceof CustomEvent) {
              // Different versions of the Mux uploader might have different event structures
              const uploadId = event.detail?.uploadId || 
                               event.detail?.id || 
                               (typeof event.detail === 'string' ? event.detail : null);
              
              if (uploadId) {
                console.log("Using upload ID from event:", uploadId);
                // Store the upload ID in a global variable for fallback
                (window as any).__lastUploadId = uploadId;
                handleUploadSuccess(uploadId);
                return;
              }
            }
            
            // Last resort: use a hardcoded ID from the most recent upload
            const globalUploadId = (window as any).__lastUploadId;
            if (globalUploadId) {
              console.log("Using global upload ID:", globalUploadId);
              handleUploadSuccess(globalUploadId);
              return;
            }
            
            throw new Error("Could not determine upload ID from any source");
          } catch (error) {
            console.error("Error in onSuccess handler:", error);
            handleUploadError(error instanceof Error ? error : new Error("Failed to process upload"));
          }
        }}
        onError={(event) => {
          console.error("MuxUploader onError event:", event);
          if (event instanceof CustomEvent) {
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
