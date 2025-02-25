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
  maxResolution?: { width: number; height: number };
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
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleError = useCallback((error: Error): void => {
    setStatus('error');
    setErrorMessage(error.message);
    onError(error);
  }, [onError]);

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

    // Check video resolution
    if (file.type.startsWith('video/')) {
      const videoResolution = await getVideoResolution(file);
      if (videoResolution.width > maxResolution.width || 
          videoResolution.height > maxResolution.height) {
        throw new Error(`Video resolution must not exceed ${maxResolution.width}x${maxResolution.height} (1080p)`);
      }
    }
  };

  const [uploadEndpoint, setUploadEndpoint] = useState<string | null>(null);

  // We need to track the upload ID to get the asset ID later
  const [uploadId] = useState<string | null>(null);
  
  // First step: Get the Mux upload URL from our API
  const getUploadUrl = useCallback(async (): Promise<{url: string; uploadId: string}> => {
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
    console.log("Upload URL response:", data);
    
    // Validate the response data more carefully
    if (!data.url) {
      throw new Error('Invalid upload response: missing URL');
    }
    
    // Store the upload ID for later use
    if (!data.uploadId || typeof data.uploadId !== 'string' || !data.uploadId.trim()) {
      throw new Error('Invalid upload response: missing or invalid upload ID');
    }
    
    // Log the IDs for debugging
    console.log("Received IDs from upload endpoint:", {
      uploadId: data.uploadId
    });
    
    // Store the upload ID
    setUploadId(data.uploadId);
    
    return {
      url: data.url,
      uploadId: data.uploadId
    };
  }, []);

  // Fetch endpoint URL when component mounts if it's a function
  useEffect(() => {
    const fetchWithRetry = async (retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const {url, uploadId} = await getUploadUrl();
          setUploadEndpoint(url);
          // We'll get the asset ID after the upload completes
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
    
    if (!uploadId) {
      console.error("No upload ID available for completed upload");
      handleError(new Error("Upload failed: No upload ID available"));
      return;
    }

    try {
      setStatus("processing");
      
      // First, we need to get the asset ID from the upload ID
      console.log("Getting asset ID from upload ID:", uploadId);
      
      // Wait a moment before checking upload status to allow Mux to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the asset ID from the upload status
      const getAssetIdFromUpload = async (retries = 3, delay = 2000): Promise<string> => {
        for (let i = 0; i < retries; i++) {
          try {
            console.log(`Checking upload status (attempt ${i + 1}/${retries})...`);
            
            const uploadResponse = await fetch(`/api/mux/upload-status?uploadId=${encodeURIComponent(uploadId)}`);
            
            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              console.error(`Upload status check failed (${uploadResponse.status}):`, errorText);
              
              if (i === retries - 1) {
                throw new Error(`Failed to get upload status: ${uploadResponse.status} ${errorText}`);
              }
            } else {
              // Success - parse and check for asset ID
              const data = await uploadResponse.json();
              console.log("Upload status response:", data);
              
              if (data.assetId) {
                console.log("Asset ID retrieved:", data.assetId);
                return data.assetId;
              } else if (i === retries - 1) {
                throw new Error("No asset ID available from upload");
              }
            }
          } catch (error) {
            console.error(`Upload status check error (attempt ${i + 1}/${retries}):`, error);
            
            if (i === retries - 1) {
              throw error;
            }
          }
          
          // Wait before the next retry
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
        
        throw new Error("Failed to get asset ID from upload after multiple attempts");
      };
      
      // Get the asset ID
      const assetId = await getAssetIdFromUpload();
      
      // Now check the asset status
      const checkAssetStatus = async (assetId: string, retries = 3, delay = 2000): Promise<{status: string; playbackId?: string}> => {
        for (let i = 0; i < retries; i++) {
          try {
            console.log(`Checking asset status (attempt ${i + 1}/${retries})...`);
            
            // Make sure we're using the asset ID, not the upload ID
            const assetResponse = await fetch(`/api/mux/asset-status?assetId=${encodeURIComponent(assetId)}`);
            
            if (!assetResponse.ok) {
              const errorText = await assetResponse.text();
              console.error(`Asset status check failed (${assetResponse.status}):`, errorText);
              
              // If this is the last retry, throw the error
              if (i === retries - 1) {
                throw new Error(`Failed to get asset status: ${assetResponse.status} ${errorText}`);
              }
            } else {
              // Success - parse and return the data
              const data = await assetResponse.json();
              console.log("Asset status response:", data);
              return data;
            }
          } catch (error) {
            console.error(`Asset status check error (attempt ${i + 1}/${retries}):`, error);
            
            // If this is the last retry, throw the error
            if (i === retries - 1) {
              throw error;
            }
          }
          
          // Wait before the next retry
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
        
        // This should never be reached due to the throws above, but TypeScript wants a return
        throw new Error("Failed to get asset status after multiple attempts");
      };
      
      // Check asset status with retries
      const assetData = await checkAssetStatus(assetId);
      
      if (assetData.status === 'errored') {
        throw new Error('Video processing failed');
      }

      if (!assetData.playbackId) {
        throw new Error('No playback ID available');
      }

      console.log("Upload and processing completed successfully:", {
        assetId: assetId,
        status: assetData.status,
        playbackId: assetData.playbackId
      });

      setStatus("ready");
      onUploadComplete(assetId);
    } catch (error) {
      console.error("Error processing video upload:", error);
      handleError(error instanceof Error ? error : new Error('Failed to process video upload'));
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
        Accepted formats: {acceptedTypes.join(', ')} (max {maxSizeMB}MB, max resolution 1080p)
      </p>
    </div>
  );
}
