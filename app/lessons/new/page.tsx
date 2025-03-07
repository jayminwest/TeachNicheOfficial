import { Suspense } from 'react';
import NewLessonClientWrapper from './client-wrapper';

export const dynamic = 'force-dynamic';

export default function NewLessonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Create New Lesson
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Share your knowledge with the world. Fill out the form below to create your new lesson.
            </p>
          </div>
          <div className="bg-card rounded-lg border shadow-sm p-6 md:p-8">
            <Suspense fallback={
              <div className="animate-pulse flex flex-col space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded w-1/4 self-end"></div>
              </div>
            }>
              <NewLessonClientWrapper />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
