'use client';

import LessonDetail from "./lesson-detail";

interface LessonPageClientProps {
  lessonId: string;
  session?: {
    user?: {
      id: string;
    };
  } | null;
}

export default function LessonPageClient({ lessonId, session }: LessonPageClientProps) {
  if (!lessonId) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          Lesson ID is required
        </div>
      </div>
    );
  }
  
  return <LessonDetail id={lessonId} session={session} />;
}
