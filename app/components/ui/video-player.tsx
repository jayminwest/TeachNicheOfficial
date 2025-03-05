"use client";

import { cn } from "@/app/lib/utils";
import MuxPlayer from "@mux/mux-player-react";
import { useState, useEffect } from "react";

interface VideoPlayerProps {
  playbackId: string;
  title: string;
  className?: string;
  id?: string;
  price?: number;
  isFree?: boolean;
}

export function VideoPlayer({ 
  playbackId, 
  title, 
  className,
  id,
  price,
  isFree = false
}: VideoPlayerProps) {
  const [jwt, setJwt] = useState<string>();
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use a stable timestamp for player initialization
  const [playerInitTime] = useState(() => Date.now().toString());

  useEffect(() => {
    setIsMounted(true);
    
    let isMounted = true;
    
    // Validate the playback ID
    if (!playbackId) {
      setError('Video is still processing. Please check back later.');
      return;
    }
    
    if (playbackId && (playbackId.startsWith('temp_') || playbackId.startsWith('dummy_') || playbackId.startsWith('local_'))) {
      setError(`Video is still processing. Please check back later.`);
      return;
    }
    
    if (!isFree) {
      // Get signed JWT from your backend
      fetch('/api/video/sign-playback/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          playbackId,
          lessonId: id // Pass the lesson ID to the API
        })
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          setJwt(data.token);
        }
      })
      .catch(error => {
        console.error('Error fetching playback token:', error);
        if (isMounted) {
          setError(`Error loading video: ${error.message}`);
        }
        // Continue without a token - will use public playback if available
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [playbackId, isFree, id]);

  // Prevent hydration mismatch by only rendering on client
  if (!isMounted) {
    return (
      <div
        className={cn(
          "w-full aspect-video bg-muted/30 flex items-center justify-center rounded-lg",
          className
        )}
      >
        <div className="text-muted-foreground">Loading player...</div>
      </div>
    );
  }

  // Show error state if we have an error
  if (error) {
    return (
      <div
        className={cn(
          "w-full aspect-video bg-muted/30 flex items-center justify-center rounded-lg",
          className
        )}
      >
        <div className="text-red-500 p-4 text-center">
          <p className="font-semibold mb-2">Video Playback Error</p>
          <p>{error}</p>
          <p className="text-sm mt-2">Please try again later or contact support if this persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("aspect-video rounded-lg overflow-hidden", className)}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ 
          video_id: id,
          video_title: title,
          player_init_time: playerInitTime,
        }}
        streamType="on-demand"
        tokens={{
          playback: jwt
        }}
        onError={(error) => {
          console.error('Mux player error:', error);
          setError(`Video playback error: ${error.message || 'Unknown error'}`);
        }}
      />
    </div>
  );
}
