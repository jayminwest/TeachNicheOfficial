import { Suspense } from 'react';
import RequestsClient from './requests-client';
import { Skeleton } from '@/app/components/ui/skeleton';

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
        <RequestsClient />
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
