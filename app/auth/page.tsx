import AuthClientWrapper from './auth-client';

export default function AuthPage() {
  return (
    <>
      <AuthClientWrapper />
      
      <noscript>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
          <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
              JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
            </div>
          </div>
        </div>
      </noscript>
    </>
  );
}
import { Suspense } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';
import AuthClientWrapper from './auth-client';

export default function AuthPage() {
  return (
    <div className="min-h-screen pt-16">
      <Suspense fallback={
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
      }>
        <AuthClientWrapper />
      </Suspense>
      
      <noscript>
        <div className="container max-w-md mx-auto py-8">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}
