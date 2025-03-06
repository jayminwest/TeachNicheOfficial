'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ClientWrapperProps {
  children: ReactNode;
  loadingMessage?: string;
  errorFallback?: ReactNode;
  timeoutMs?: number;
}

/**
 * A wrapper component for client-side rendering with proper mounting,
 * loading states, error handling, and safety timeouts.
 * 
 * Usage:
 * ```tsx
 * <ClientWrapper>
 *   <YourClientComponent />
 * </ClientWrapper>
 * ```
 */
export function ClientWrapper({
  children,
  loadingMessage = 'Loading...',
  errorFallback,
  timeoutMs = 5000
}: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Set mounted state
    setMounted(true);
    
    // Add safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!mounted) {
        console.warn('Component mounting timeout triggered');
        setError(new Error('Loading timed out. Please refresh the page.'));
        setMounted(true);
      }
    }, timeoutMs);
    
    return () => clearTimeout(timeoutId);
  }, [mounted, timeoutMs]);
  
  // Handle errors
  if (error) {
    return errorFallback ? (
      <>{errorFallback}</>
    ) : (
      <div className="p-6 bg-destructive/10 rounded-lg flex flex-col items-center justify-center">
        <p className="text-lg font-medium">Something went wrong</p>
        <p className="text-muted-foreground mb-4">{error.message}</p>
      </div>
    );
  }
  
  // Show loading state if not mounted
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>{loadingMessage}</p>
      </div>
    );
  }
  
  // Render children when mounted
  return <>{children}</>;
}
