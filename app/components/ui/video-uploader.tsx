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
  lessonId?: string; // Add this parameter
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
  useLargeFileWorkaround = false,
  lessonId
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
    },
    lessonId
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
          
          // Extract the upload ID from the event
          let uploadId = null;
          
          // First try to get the upload ID from the URL
          try {
            const url = new URL(uploadEndpoint);
            const urlParams = new URLSearchParams(url.search);
            uploadId = urlParams.get('upload_id');
            
            if (uploadId) {
              console.log("Found upload ID in URL:", uploadId);
            }
          } catch (e) {
            console.warn("Error parsing upload endpoint URL:", e);
          }
          
          // Then try to get it from the event detail
          if (!uploadId && event instanceof CustomEvent && event.detail) {
            console.log("Examining event detail:", event.detail);
            
            // If detail is a string, use it directly
            if (typeof event.detail === 'string') {
              uploadId = event.detail;
              console.log("Using string event detail as upload ID:", uploadId);
            } 
            // If detail has specific properties, check those
            else if (typeof event.detail === 'object') {
              // Check common ID properties
              if (event.detail.uploadId) {
                uploadId = event.detail.uploadId;
                console.log("Found uploadId in event detail:", uploadId);
              } else if (event.detail.id) {
                uploadId = event.detail.id;
                console.log("Found id in event detail:", uploadId);
              } else if (event.detail.upload_id) {
                uploadId = event.detail.upload_id;
                console.log("Found upload_id in event detail:", uploadId);
              } else {
                // Log all properties for debugging
                console.log("Event detail properties:", Object.keys(event.detail));
                
                // Try to find any property that might contain the upload ID
                for (const key in event.detail) {
                  if (key.toLowerCase().includes('id') && typeof event.detail[key] === 'string') {
                    console.log(`Found potential ID in property ${key}:`, event.detail[key]);
                    uploadId = event.detail[key];
                    break;
                  }
                }
              }
            }
          }
          
          // Fallback to global variable if it exists
          if (!uploadId && (window as any).__lastUploadId) {
            console.log("Using fallback upload ID from global variable");
            uploadId = (window as any).__lastUploadId;
          }
          
          // Fallback to DOM data attribute
          if (!uploadId) {
            const uploadIdElement = document.querySelector('[data-upload-id]');
            if (uploadIdElement) {
              uploadId = uploadIdElement.getAttribute('data-upload-id');
              console.log("Using fallback upload ID from DOM:", uploadId);
            }
          }
          
          // If we still don't have an ID, create a temporary one
          if (!uploadId) {
            console.log("Could not determine upload ID from event, creating temporary ID");
            uploadId = `temp_${Date.now()}`;
            console.log("Created temporary upload ID:", uploadId);
          }
          
          console.log("Final upload ID being used:", uploadId);
          handleUploadSuccess(uploadId);
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
      <p className="text-xs text-muted-foreground mt-1">
        Note: Uploaded lessons will be automatically published once processing is complete.
      </p>
    </div>
  );
}
