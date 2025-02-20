"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface VideoStatusProps {
  status: 'pending' | 'processing' | 'ready' | 'error';
  error?: string;
  className?: string;
}

export function VideoStatus({ 
  status, 
  error, 
  className 
}: VideoStatusProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {status === 'pending' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Waiting to process...</span>
        </>
      )}
      
      {status === 'processing' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-blue-500">Processing video...</span>
        </>
      )}
      
      {status === 'ready' && (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-500">Video ready</span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">
            {error || 'Error processing video'}
          </span>
        </>
      )}
    </div>
  );
}
