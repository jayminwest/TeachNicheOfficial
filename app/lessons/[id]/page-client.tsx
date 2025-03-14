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
        if (response.ok) {
          const data = await response.json();
          setInitialLesson(data);
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
