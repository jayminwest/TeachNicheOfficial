"use client";

import { cn } from "@/lib/utils";
import MuxPlayer from "@mux/mux-player-react";

interface VideoPlayerProps {
  playbackId: string;
  title: string;
  className?: string;
  id?: string;
}

export function VideoPlayer({ 
  playbackId, 
  title, 
  className,
  id
}: VideoPlayerProps) {
  return (
    <div className={cn("aspect-video rounded-lg overflow-hidden", className)}>
      <MuxPlayer
        id={id}
        playbackId={playbackId}
        metadata={{ 
          video_title: title,
        }}
        streamType="on-demand"
        autoPlay="muted"
      />
    </div>
  );
}
