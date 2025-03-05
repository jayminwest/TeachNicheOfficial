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
