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
  // Use a stable timestamp for player initialization
  const [playerInitTime] = useState(() => Date.now().toString());

  useEffect(() => {
    setIsMounted(true);
    
    let isMounted = true;
    
    if (!isFree) {
      // Get signed JWT from your backend
      fetch('/api/video/sign-playback', {
        method: 'POST',
        body: JSON.stringify({ playbackId })
      })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setJwt(data.token);
        }
      })
      .catch(error => {
        console.error('Error fetching playback token:', error);
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [playbackId, isFree]);

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
      />
    </div>
  );
}
