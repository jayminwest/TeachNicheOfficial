"use client";

import { cn } from "@/lib/utils";
import MuxUploader from "@mux/mux-uploader-react";
import { useState } from "react";
import { Button } from "./button";
import { Progress } from "./progress";

interface VideoUploaderProps {
  onUploadComplete: (assetId: string) => void;
  onError: (error: Error) => void;
  className?: string;
}

export function VideoUploader({ 
  onUploadComplete, 
  onError, 
  className 
}: VideoUploaderProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  return (
    <div className={cn("relative space-y-4", className)}>
      <MuxUploader
        endpoint="/api/video/upload"
        onUploadStart={() => {
          setStatus('uploading');
          setProgress(0);
        }}
        onUploadProgress={(progressEvent) => {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(percent);
        }}
        onSuccess={(res) => {
          setStatus('processing');
          onUploadComplete(res.assetId);
        }}
        onError={(error) => {
          setStatus('error');
          onError(error);
        }}
      >
        {status === 'idle' && (
          <Button type="button">Upload Video</Button>
        )}
      </MuxUploader>

      {status !== 'idle' && (
        <Progress value={progress} className="w-full" />
      )}

      <p className="text-sm text-muted-foreground">
        {status === 'uploading' && `Uploading... ${progress}%`}
        {status === 'processing' && 'Processing video...'}
        {status === 'ready' && 'Upload complete!'}
        {status === 'error' && 'Upload failed. Please try again.'}
      </p>
    </div>
  );
}
