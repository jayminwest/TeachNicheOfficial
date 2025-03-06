'use client';

import { useState, useEffect } from 'react';
import AuthClientWrapper from './auth-client';

export default function SearchParamsWrapper() {
  // Initialize with null values
  const [params, setParams] = useState<{error: string | null, redirect: string | null, showSignIn: boolean}>({
    error: null,
    redirect: null,
    showSignIn: false
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Get search params safely on the client side
  useEffect(() => {
    console.log('SearchParamsWrapper: Extracting search params');
    try {
      // Get the search params directly from window.location
      // This avoids using useSearchParams() which causes SSR bailout
      const url = new URL(window.location.href);
      
      // Extract the values you need from URL
      const error = url.searchParams.get('error') || null;
      const redirect = url.searchParams.get('redirect') || null;
      const showSignIn = url.searchParams.get('signin') === 'true';
      
      // Update state with the extracted values
      setParams({ error, redirect, showSignIn });
      console.log('SearchParamsWrapper: Params extracted', { error, redirect, showSignIn });
    } catch (err) {
      console.error('SearchParamsWrapper: Error extracting search params', err);
    } finally {
      setIsLoading(false);
    }
    
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('SearchParamsWrapper safety timeout triggered');
        setIsLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [isLoading]);
  
  if (isLoading) {
    return (
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground">
            Preparing authentication...
          </p>
        </div>
      </div>
    );
  }
  
  // Pass only the extracted values to AuthClientWrapper
  return (
    <AuthClientWrapper 
      errorMessage={params.error} 
      redirectUrl={params.redirect}
      showSignIn={params.showSignIn}
    />
  );
}
