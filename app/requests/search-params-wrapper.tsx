'use client';

import { useSearchParams } from 'next/navigation';
import RequestsClient from './requests-client';

export default function SearchParamsWrapper() {
  // Get the search params
  const searchParams = useSearchParams();
  
  // Extract the values you need from searchParams
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'recent';
  
  // Pass only the extracted values to RequestsClient
  return <RequestsClient initialCategory={category} initialSortBy={sortBy} />;
}
