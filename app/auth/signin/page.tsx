import { Suspense } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';
import SignInClient from './signin-client';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';

export const dynamic = 'force-static';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <Suspense fallback={
        <div className="animate-pulse">
          <h1 className="text-4xl font-bold mb-4">Sign In</h1>
          <Skeleton className="h-8 w-64 mx-auto mb-8" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      }>
        <ErrorBoundary
          fallback={
            <div className="flex flex-col items-center">
              <h1 className="text-4xl font-bold mb-4">Sign In</h1>
              <div className="p-6 bg-destructive/10 rounded-lg flex flex-col items-center justify-center mb-4">
                <p className="text-lg font-medium">Something went wrong</p>
                <p className="text-muted-foreground mb-4">Please try again or refresh the page</p>
              </div>
              <a 
                href="/auth"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Go to Sign In
              </a>
            </div>
          }
        >
          <SignInClient />
        </ErrorBoundary>
      </Suspense>
      
      <noscript>
        <div className="mt-8 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
        </div>
      </noscript>
    </div>
  );
}
