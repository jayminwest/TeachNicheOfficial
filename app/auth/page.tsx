import { Suspense } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';
import AuthClientLoader from './auth-client-loader';

export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Suspense fallback={
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
      }>
        <ErrorBoundary
          fallback={
            <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
              <div className="space-y-1 mb-4">
                <h1 className="text-2xl font-bold">Sign in</h1>
                <p className="text-muted-foreground">
                  Sign in to access your account and lessons
                </p>
              </div>
              
              <div className="p-6 bg-destructive/10 rounded-lg flex flex-col items-center justify-center mb-4">
                <p className="text-lg font-medium">Something went wrong</p>
                <p className="text-muted-foreground mb-4">Please try again or refresh the page</p>
              </div>
            </div>
          }
        >
          <AuthClientLoader />
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
