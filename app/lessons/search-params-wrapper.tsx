'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LessonsClient from './lessons-client';

// This component should only be rendered inside a Suspense boundary
export default function SearchParamsWrapper() {
  // Get the search params
  const searchParams = useSearchParams();
  
  // Extract the values you need from searchParams
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  // Pass only the extracted values to LessonsClient
  return <LessonsClient initialQuery={query} initialCategory={category} initialPage={page} />;
}
