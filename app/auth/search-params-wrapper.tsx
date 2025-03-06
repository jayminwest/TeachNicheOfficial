'use client';

// Don't import useSearchParams directly in this component
// Instead, use window.location in a useEffect hook
import { useState, useEffect, Suspense } from 'react';
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
    } catch (err) {
      console.error('Error extracting search params:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }
  
  // Pass only the extracted values to AuthClientWrapper, wrapped in Suspense boundary
  return (
    <AuthClientWrapper 
      errorMessage={params.error} 
      redirectUrl={params.redirect}
      showSignIn={params.showSignIn}
    />
  );
}
