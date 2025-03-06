export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';
import SearchParamsWrapper from './search-params-wrapper';

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
          <ErrorBoundary
            fallback={
              <div className="p-6 bg-destructive/10 rounded-lg flex flex-col items-center justify-center">
                <p className="text-lg font-medium">Something went wrong loading lessons</p>
                <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
              </div>
            }
          >
            <SearchParamsWrapper />
          </ErrorBoundary>
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
