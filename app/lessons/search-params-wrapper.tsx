'use client';

// Don't import useSearchParams directly in this component
// Instead, use window.location in a useEffect hook
import { useState, useEffect } from 'react';
import LessonsClient from './lessons-client';

export default function SearchParamsWrapper() {
  // Initialize with default values
  const [params, setParams] = useState({
    query: '',
    category: '',
    page: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Get search params safely on the client side
  useEffect(() => {
    try {
      // Get the search params directly from window.location
      // This avoids using useSearchParams() which causes SSR bailout
      const url = new URL(window.location.href);
      
      // Extract the values you need from URL
      const query = url.searchParams.get('query') || '';
      const category = url.searchParams.get('category') || '';
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      
      // Update state with the extracted values
      setParams({ query, category, page });
    } catch (err) {
      console.error('Error extracting search params:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-full max-w-sm bg-muted animate-pulse rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[300px] w-full bg-muted animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Pass only the extracted values to LessonsClient
  return <LessonsClient initialQuery={params.query} initialCategory={params.category} initialPage={params.page} />;
}
