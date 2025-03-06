'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/app/components/ui/skeleton';

// Import the client component with no SSR to avoid hydration issues
const SearchParamsWrapper = dynamic(() => import('./search-params-wrapper'), { 
  ssr: false,
  loading: () => (
    <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
      <div className="space-y-1 mb-4">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-muted-foreground">
          Sign in to access your account and lessons
        </p>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
});

export default function AuthClientLoader() {
  return <SearchParamsWrapper />;
}
