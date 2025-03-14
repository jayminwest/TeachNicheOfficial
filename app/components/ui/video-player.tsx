"use client";

import { cn } from "@/app/lib/utils";
import MuxPlayer from "@mux/mux-player-react";
import { useState, useEffect } from "react";

interface VideoPlayerProps {
  playbackId: string;
  title: string;
  className?: string;
  playbackToken?: string | null;
  thumbnailToken?: string | null;
  storyboardToken?: string | null;
}

export function VideoPlayer({ 
  playbackId, 
  title, 
  className,
  playbackToken,
  thumbnailToken,
  storyboardToken
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
          {error.includes('Authorization error') && (
            <div className="mt-2 text-sm">
              <p>This video requires authentication tokens.</p>
              <button 
                onClick={() => setError(null)} 
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check if this is a signed playback ID (contains underscore)
  const isSignedPlaybackId = playbackId.includes('_');
  
  // If it's a signed playback ID but we don't have a token, show an error
  if (isSignedPlaybackId && !playbackToken) {
    return (
      <div className={cn("w-full aspect-video bg-muted/30 flex items-center justify-center rounded-lg", className)}>
        <div className="text-red-500 p-4 text-center">
          <p>This video requires authentication. Fetching authentication tokens...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
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
        playbackToken={playbackToken || undefined}
        thumbnailToken={thumbnailToken || playbackToken || undefined}
        storyboardToken={storyboardToken || playbackToken || undefined}
        onError={(error) => {
          console.error('Mux player error:', error);
          // Check for authorization errors specifically
          if (error.message && error.message.includes('Authorization error')) {
            setError('Authorization error: This video requires authentication tokens. Refreshing may resolve this issue.');
          } else {
            setError(`Video playback error: ${error.message || 'Unknown error'}`);
          }
        }}
      />
    </div>
  );
}
