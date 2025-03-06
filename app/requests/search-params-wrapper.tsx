'use client';

// Don't import useSearchParams at all
import { useState, useEffect } from 'react';
import RequestsClient from './requests-client';

export default function SearchParamsWrapper() {
  // Initialize with default values
  const [params, setParams] = useState({
    category: '',
    sortBy: 'recent'
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Get search params safely on the client side
  useEffect(() => {
    try {
      // Get the search params directly from window.location
      // This avoids using useSearchParams() which causes SSR bailout
      const url = new URL(window.location.href);
      
      // Extract the values you need from URL
      const category = url.searchParams.get('category') || '';
      const sortBy = url.searchParams.get('sort') || 'recent';
      
      // Update state with the extracted values
      setParams({ category, sortBy });
    } catch (err) {
      console.error('Error extracting search params:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  if (isLoading) {
    return (
      <div className="container p-8 space-y-6">
        <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-md"></div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-[120px] w-full bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Pass only the extracted values to RequestsClient
  return <RequestsClient initialCategory={params.category} initialSortBy={params.sortBy} />;
}
