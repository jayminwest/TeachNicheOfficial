'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import SearchParamsWrapper from './search-params-wrapper';

export default function AuthClientLoader() {
  const [mounted, setMounted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  
  useEffect(() => {
    console.log('AuthClientLoader mounting');
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
  }, [mounted]);
  
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
  return <SearchParamsWrapper />;
}
