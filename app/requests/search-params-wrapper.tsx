'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RequestsClient from './requests-client';

// This component should only be rendered inside a Suspense boundary
export default function SearchParamsWrapper() {
  // Get the search params
  const searchParams = useSearchParams();
  
  // Extract the values you need from searchParams
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'recent';
  
  // Pass only the extracted values to RequestsClient
  return <RequestsClient initialCategory={category} initialSortBy={sortBy} />;
}
