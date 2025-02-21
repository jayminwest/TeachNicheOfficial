"use client";

import { cn } from "@/app/lib/utils";
import MuxPlayer from "@mux/mux-player-react";
import { useState, useEffect } from "react";
import { LessonAccessGate } from "./lesson-access-gate";

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

  useEffect(() => {
    if (!isFree) {
      // Get signed JWT from your backend
      fetch('/api/video/sign-playback', {
        method: 'POST',
        body: JSON.stringify({ playbackId })
      })
      .then(res => res.json())
      .then(data => setJwt(data.token));
    }
  }, [playbackId, isFree]);

  return (
    <LessonAccessGate lessonId={id!} price={price} className={cn("aspect-video rounded-lg overflow-hidden", className)}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ 
          video_id: id,
          video_title: title,
        }}
        streamType="on-demand"
        tokens={{
          playback: jwt
        }}
      />
    </LessonAccessGate>
  );
}
