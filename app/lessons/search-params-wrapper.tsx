'use client';

import { useSearchParams } from 'next/navigation';
import LessonsClient from './lessons-client';

export default function SearchParamsWrapper() {
  // This component's sole purpose is to isolate the useSearchParams hook
  // so it can be properly wrapped in a Suspense boundary
  const searchParams = useSearchParams();
  
  // You can pass the search params to the LessonsClient component if needed
  return <LessonsClient />;
}
