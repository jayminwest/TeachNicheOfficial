'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';

// Dynamically import the search params wrapper with no SSR
const SearchParamsWrapper = dynamic(
  () => import('./search-params-wrapper'),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full max-w-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }
);

export default function ClientWrapper() {
  return (
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
      <SearchParamsWrapper />
    </Suspense>
  );
}
