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
  
  // If it's a signed playback ID but we don't have a token, show a loading state
  // and automatically try to fetch the token
  if (isSignedPlaybackId && !playbackToken) {
    // Attempt to fetch the token if we don't have it yet
    useEffect(() => {
      const fetchToken = async () => {
        try {
          const response = await fetch(`/api/mux/token?playbackId=${playbackId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.status}`);
          }
          const data = await response.json();
          // Force a re-render with the new tokens
          window.location.reload();
        } catch (err) {
          console.error('Error fetching token:', err);
          setError(`Failed to fetch authentication token: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      };
      
      fetchToken();
    }, [playbackId]);
    
    return (
      <div className={cn("w-full aspect-video bg-muted/30 flex items-center justify-center rounded-lg", className)}>
        <div className="text-muted-foreground p-4 text-center">
          <p>Authenticating video playback...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
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
          if (error.detail && error.detail.message && error.detail.message.includes('Authorization error')) {
            // For authorization errors, try to fetch a new token
            const fetchNewToken = async () => {
              try {
                const response = await fetch(`/api/mux/token?playbackId=${playbackId}&refresh=true`);
                if (!response.ok) {
                  throw new Error(`Failed to refresh token: ${response.status}`);
                }
                const data = await response.json();
                // Force a reload to apply the new token
                window.location.reload();
              } catch (tokenError) {
                setError('Authorization error: Failed to refresh authentication token. Please try again later.');
              }
            };
            
            fetchNewToken();
            setError('Authorization error: Refreshing authentication tokens...');
          } else {
            setError(`Video playback error: ${error.detail?.message || error.message || 'Unknown error'}`);
          }
        }}
      />
    </div>
  );
}
