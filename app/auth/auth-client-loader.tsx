'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import SearchParamsWrapper from './search-params-wrapper';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';

export default function AuthClientLoader() {
  const [mounted, setMounted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    console.log('AuthClientLoader mounting');
    try {
      setMounted(true);
      
      // Safety timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (!mounted) {
          console.warn('AuthClientLoader safety timeout triggered after 2 seconds');
          setTimedOut(true);
          setMounted(true); // Force mounted state
        }
      }, 2000);
      
      return () => {
        console.log('AuthClientLoader unmounting');
        clearTimeout(timeoutId);
      };
    } catch (err) {
      console.error('Error in AuthClientLoader:', err);
      setError(err instanceof Error ? err : new Error('Unknown error in auth loader'));
    }
  }, [mounted]);
  
  // Handle errors
  if (error) {
    return (
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="font-bold">Authentication Error</h3>
          <p>{error.message || 'There was a problem loading the authentication page.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  // Show loading state during initial client render
  if (!mounted && !timedOut) {
    return (
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Initializing authentication...</p>
        </div>
      </div>
    );
  }
  
  // Show error state if timed out
  if (timedOut && !mounted) {
    return (
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="font-bold">Loading Error</h3>
          <p>There was a problem loading the authentication page. Please refresh to try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  // Render the search params wrapper once mounted
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="font-bold">Authentication Error</h3>
          <p>There was a problem with the authentication component.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Refresh Page
          </button>
        </div>
      }
    >
      <SearchParamsWrapper />
    </ErrorBoundary>
  );
}
