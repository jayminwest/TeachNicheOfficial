"use client";

import { cn } from "@/app/lib/utils";
import MuxPlayer from "@mux/mux-player-react";
import { useState, useEffect } from "react";

interface VideoPlayerProps {
  playbackId: string;
  title: string;
  className?: string;
}

export function VideoPlayer({ 
  playbackId, 
  title, 
  className
}: VideoPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Basic validation
    if (!playbackId) {
      setError('Video is still processing. Please check back later.');
    }
  }, [playbackId]);

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className={cn("w-full aspect-video bg-muted/30 flex items-center justify-center rounded-lg", className)}>
        <div className="text-muted-foreground">Loading player...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn("w-full aspect-video bg-muted/30 flex items-center justify-center rounded-lg", className)}>
        <div className="text-red-500 p-4 text-center">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("aspect-video rounded-lg overflow-hidden", className)}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ video_title: title }}
        streamType="on-demand"
        onError={(error) => {
          console.error('Mux player error:', error);
          setError(`Video playback error: ${error.message || 'Unknown error'}`);
        }}
      />
    </div>
  );
}
