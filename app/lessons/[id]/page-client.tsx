'use client';

import LessonDetail from "./lesson-detail";
import { useEffect, useState } from "react";

interface LessonPageClientProps {
  lessonId: string;
  session?: {
    user?: {
      id: string;
    };
  } | null;
}

export default function LessonPageClient({ lessonId, session }: LessonPageClientProps) {
  const [initialLesson, setInitialLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!lessonId) return;
    
    async function fetchInitialLesson() {
      try {
        const response = await fetch(`/api/lessons/${lessonId}`);
        if (!response.ok) {
          console.error("Error fetching lesson:", response.status);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setInitialLesson(data);
        
        // Pre-fetch token if this is a signed playback ID
        if (data?.mux_playback_id && data.mux_playback_id.includes('_')) {
          console.log("Pre-fetching token for signed playback ID");
          try {
            const tokenResponse = await fetch(`/api/mux/token?playbackId=${data.mux_playback_id}`);
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              // Store tokens in sessionStorage for immediate use
              sessionStorage.setItem(`mux-token-${data.mux_playback_id}`, tokenData.token);
              sessionStorage.setItem(`mux-thumbnail-token-${data.mux_playback_id}`, tokenData.thumbnailToken);
              sessionStorage.setItem(`mux-storyboard-token-${data.mux_playback_id}`, tokenData.storyboardToken);
              console.log("Tokens pre-fetched and stored in session storage");
            } else {
              console.error("Failed to pre-fetch token:", tokenResponse.status);
            }
          } catch (tokenError) {
            console.error("Error pre-fetching token:", tokenError);
          }
        }
      } catch (error) {
        console.error("Error fetching initial lesson data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInitialLesson();
  }, [lessonId]);
  
  if (!lessonId) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          Lesson ID is required
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }
  
  return <LessonDetail id={lessonId} session={session} initialLesson={initialLesson} />;
}
