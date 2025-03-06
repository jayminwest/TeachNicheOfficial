'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';

// Use dynamic import with SSR disabled to avoid useSearchParams issues
const AuthClientLoader = dynamic(() => import('./auth-client-loader'), { 
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
    </div>
  )
});

export default function ClientAuthWrapper() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      </div>
    }>
      <AuthClientLoader />
    </Suspense>
  );
}
