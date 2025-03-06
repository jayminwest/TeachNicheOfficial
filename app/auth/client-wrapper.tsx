'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/app/components/ui/skeleton';

// Use dynamic import with SSR disabled to avoid useSearchParams issues
const AuthClientWrapper = dynamic(() => import('./auth-client'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="space-y-1 mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    </div>
  )
});

export default function ClientWrapper() {
  return <AuthClientWrapper />;
}
