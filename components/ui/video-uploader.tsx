"use client";

import { cn } from "@/lib/utils";
import MuxUploader from "@mux/mux-uploader-react";
import { useState } from "react";
import { Button } from "./button";
import { Progress } from "./progress";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";

interface VideoUploaderProps {
  endpoint?: string | (() => Promise<string>);
  onUploadComplete: (assetId: string) => void;
  onError: (error: Error) => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  pausable?: boolean;
  noDrop?: boolean;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

interface MuxUploadEvent extends CustomEvent {
  detail: {
    file?: File;
    loaded?: number;
    total?: number;
    status?: string;
    assetId?: string;
    message?: string;
  };
}

export function VideoUploader({ 
  endpoint,
  onUploadComplete, 
  onError,
  maxSizeMB = 500,
  acceptedTypes = ['video/mp4', 'video/quicktime'],
  className,
  pausable = false,
  noDrop = false
}: VideoUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleError = (error: Error) => {
    setStatus('error');
    setErrorMessage(error.message);
    onError(error);
  };

  const validateFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`File type must be one of: ${acceptedTypes.join(', ')}`);
    }
  };

  const handleUploadStart = async (event: MuxUploadEvent) => {
    try {
      if (!event.detail.file) {
        throw new Error('No file selected');
      }
      
      validateFile(event.detail.file);
      
      // Only handle dynamic endpoint here
      if (typeof endpoint === 'function') {
        try {
          const url = await endpoint();
          // @ts-ignore - MUX uploader internal API
          event.target.url = url;
        } catch (error) {
          throw new Error('Failed to get upload URL');
        }
      }
      
      setStatus('uploading');
      setProgress(0);
      setErrorMessage('');
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Invalid file'));
    }
  };

  const handleProgress = (event: MuxUploadEvent) => {
    if (event.detail.loaded && event.detail.total) {
      const percent = Math.round((event.detail.loaded / event.detail.total) * 100);
      setProgress(percent);
    }
  };

  const handleSuccess = (event: MuxUploadEvent) => {
    const { status, assetId } = event.detail;
    if (status === 'complete' && assetId) {
      setStatus('ready');
      onUploadComplete(assetId);
    } else {
      setStatus('processing');
    }
  };

  const handleUploadError = (event: MuxUploadEvent) => {
    const message = event.detail?.message || 'Upload failed';
    console.error('Upload error:', event.detail);
    
    if (message.includes('400')) {
      handleError(new Error('Server rejected the upload. Please check file format and size.'));
    } else {
      handleError(new Error(message));
    }
  };

  return (
    <div className={cn("relative space-y-4", className)}>
      <MuxUploader
        className="mux-uploader"
        endpoint="/api/video/upload"
        onUploadStart={handleUploadStart}
        onProgress={handleProgress}
        onSuccess={handleSuccess}
        onError={handleUploadError}
        pausable={pausable}
        noDrop={noDrop}
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
