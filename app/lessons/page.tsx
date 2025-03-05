import { Suspense } from 'react';
import LessonsClient from './lessons-client';
import LessonsLoading from './loading';

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Lessons
            </h1>
            <p className="mt-2 text-muted-foreground">
              Browse and manage your lessons
            </p>
          </div>
          <a href="/lessons/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Lesson
          </a>
        </div>

        <Suspense fallback={<LessonsLoading />}>
          <LessonsClient />
        </Suspense>
      </div>
      
      <noscript>
        <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view lessons. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}
