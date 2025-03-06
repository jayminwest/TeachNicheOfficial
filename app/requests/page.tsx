import { Suspense } from 'react';
import SearchParamsWrapper from './search-params-wrapper';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';

export default function RequestsPage() {
  return (
    <div className="min-h-screen pt-16">
      <Suspense fallback={
        <div className="container p-8 space-y-6">
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      }>
        <ErrorBoundary
          fallback={
            <div className="container p-8">
              <div className="p-6 bg-destructive/10 rounded-lg flex flex-col items-center justify-center">
                <p className="text-lg font-medium">Something went wrong loading requests</p>
                <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
              </div>
            </div>
          }
        >
          <SearchParamsWrapper />
        </ErrorBoundary>
      </Suspense>
      
      <noscript>
        <div className="p-8">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view and interact with lesson requests. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}
