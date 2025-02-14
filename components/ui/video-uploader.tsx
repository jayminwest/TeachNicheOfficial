"use client";

import { cn } from "@/lib/utils";
import MuxUploader from "@mux/mux-uploader-react";
import { useState } from "react";
import { Button } from "./button";
import { Progress } from "./progress";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";

interface VideoUploaderProps {
  onUploadComplete: (assetId: string) => void;
  onError: (error: Error) => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function VideoUploader({ 
  onUploadComplete, 
  onError,
  maxSizeMB = 500,
  acceptedTypes = ['video/mp4', 'video/quicktime'],
  className 
}: VideoUploaderProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
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

  return (
    <div className={cn("relative space-y-4", className)}>
      <MuxUploader
        endpoint="/api/video/upload"
        onUploadStart={(file) => {
          try {
            validateFile(file);
            setStatus('uploading');
            setProgress(0);
            setErrorMessage('');
          } catch (error) {
            handleError(error instanceof Error ? error : new Error('Invalid file'));
          }
        }}
        onUploadProgress={(progressEvent) => {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(percent);
        }}
        onSuccess={(res) => {
          if (res.status === 'complete') {
            setStatus('ready');
            onUploadComplete(res.assetId);
          } else {
            setStatus('processing');
          }
        }}
        onError={handleError}
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
