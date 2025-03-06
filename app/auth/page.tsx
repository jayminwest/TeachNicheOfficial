'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';

// Use dynamic import with SSR disabled to avoid useSearchParams issues
const ClientAuthWrapper = dynamic(() => import('./client-auth-wrapper'), { 
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
    </div>
  )
});

// Use a static page with client-side only components to avoid SSR bailout
export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground">
            Sign in to access your account and lessons
          </p>
        </div>
        
        <Suspense fallback={
          <div className="space-y-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          </div>
        }>
          <ClientAuthWrapper />
        </Suspense>
      </div>
      
      <noscript>
        <div className="mt-8 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
        </div>
      </noscript>
    </div>
  );
}
