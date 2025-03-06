import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * A wrapper component that properly uses Suspense boundaries
 * around components that use useSearchParams
 */
export function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
      {children}
    </Suspense>
  );
}

/**
 * A client component that uses useSearchParams
 */
export function SearchParamsComponent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || 'default';
  
  return (
    <div data-testid="search-params-component">
      Query: {query}
    </div>
  );
}

/**
 * A component that properly wraps a search params component
 * with a suspense boundary
 */
export function ProperSearchParamsUsage() {
  return (
    <SuspenseWrapper>
      <SearchParamsComponent />
    </SuspenseWrapper>
  );
}
