import { Suspense } from 'react';
import LessonsClient from './lessons-client';
import { Skeleton } from '@/app/components/ui/skeleton';

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <Suspense fallback={
          <div className="space-y-4">
            <Skeleton className="h-12 w-full max-w-sm" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
              ))}
            </div>
          </div>
        }>
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
