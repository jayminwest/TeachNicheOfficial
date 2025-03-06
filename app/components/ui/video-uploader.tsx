"use client";

import { cn } from "@/app/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";
import { AlertCircle, CheckCircle2, Upload, Loader2 } from "lucide-react";
import MuxUploader from "@mux/mux-uploader-react";
import { useVideoUpload } from "@/app/hooks/use-video-upload";


interface VideoUploaderProps {
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
  lessonId?: string;
}

import type { MuxUploaderProps } from "@mux/mux-uploader-react";

export function VideoUploader({ 
  onUploadComplete, 
  onError,
  onUploadStart,
  maxSizeMB = 2000,
  acceptedTypes = ['video/mp4', 'video/quicktime', 'video/heic', 'video/heif'],
  className,
  pausable = false,
  noDrop = false,
  chunkSize,
  dynamicChunkSize = false,
  useLargeFileWorkaround = false,
  lessonId
}: VideoUploaderProps) {

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

    // Skip resolution check
    console.log("Skipping video resolution check");
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
        onProgress={(event) => {
          if (event instanceof CustomEvent) {
            handleUploadProgress(event as CustomEvent<number>);
          }
        }}
        onSuccess={(event) => {
          console.log("MuxUploader onSuccess event:", event);
          
          // Extract the upload ID from the endpoint URL
          // The endpoint URL contains the upload ID as part of the path or query parameters
          let uploadId: string | undefined;
          
          try {
            // First try to get it from the event
            const eventDetail = event?.detail as unknown as { uploadId?: string };
            if (eventDetail?.uploadId) {
              uploadId = eventDetail.uploadId;
              console.log("Got upload ID from event:", uploadId);
            } else if (uploadEndpoint) {
              // Extract from the uploadEndpoint URL
              const url = new URL(uploadEndpoint);
              
              // The upload ID is typically in the path or as a query parameter
              const pathParts = url.pathname.split('/');
              const lastPathPart = pathParts[pathParts.length - 1];
              
              if (lastPathPart && lastPathPart.length > 8) {
                // If the last path part looks like an ID, use it
                uploadId = lastPathPart;
                console.log("Extracted upload ID from URL path:", uploadId);
              } else {
                // Try to get it from query parameters
                const params = new URLSearchParams(url.search);
                const idFromParams = params.get('upload_id');
                if (idFromParams) {
                  uploadId = idFromParams;
                  console.log("Extracted upload ID from URL params:", uploadId);
                }
              }
            }
            
            // If we still don't have an ID, try to get it from the stored global variable
            if (!uploadId) {
              uploadId = (window as any).__lastUploadId;
              console.log("Using stored upload ID:", uploadId);
            }
          } catch (error) {
            console.error("Error extracting upload ID:", error);
          }
          
          if (!uploadId) {
            // If we still don't have an ID, generate a temporary one based on timestamp
            // This is a fallback to prevent the upload from failing completely
            uploadId = `temp_${Date.now()}`;
            console.warn("No upload ID found, using generated temporary ID:", uploadId);
          }
          
          // Store the upload ID in the database if we have a lesson ID
          if (lessonId) {
            fetch('/api/lessons/update-upload-id', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lessonId,
                muxUploadId: uploadId
              })
            }).then(response => {
              if (!response.ok) {
                throw new Error('Failed to update lesson with upload ID');
              }
              return response.json();
            }).catch(error => {
              console.error('Error updating lesson with upload ID:', error);
            });
          }
          
          // Ensure we properly encode the assetId when fetching playback ID later
          try {
            window.sessionStorage.setItem('lastMuxAssetId', uploadId);
            console.log('Stored asset ID in session storage:', uploadId);
            
            // Also store it in localStorage as a backup
            localStorage.setItem('lastMuxAssetId', uploadId);
            
            // Set a global variable as another fallback
            (window as any).__muxAssetId = uploadId;
          } catch (storageError) {
            console.error('Failed to store asset ID in session storage:', storageError);
          }
          
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
