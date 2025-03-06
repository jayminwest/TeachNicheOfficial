'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';
import AuthClientWrapper from './client-wrapper';

export default function ClientAuthWrapper() {
  const [mounted, setMounted] = useState(false);
  const [params, setParams] = useState<{error: string | null, redirect: string | null, showSignIn: boolean}>({
    error: null,
    redirect: null,
    showSignIn: false
  });
  
  useEffect(() => {
    try {
      setMounted(true);
      
      // Extract URL parameters directly without useSearchParams
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const error = url.searchParams.get('error') || null;
        const redirect = url.searchParams.get('redirect') || null;
        const showSignIn = url.searchParams.get('signin') === 'true';
        
        setParams({ error, redirect, showSignIn });
      }
    } catch (err) {
      console.error('Error in ClientAuthWrapper:', err);
    }
  }, []);
  
  // Show loading state during initial client render
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }
  
  // Render the auth client wrapper once mounted with extracted params
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
      <AuthClientWrapper 
        errorMessage={params.error} 
        redirectUrl={params.redirect}
        showSignIn={params.showSignIn}
      />
    </ErrorBoundary>
  );
}
