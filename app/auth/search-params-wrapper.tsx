'use client';

import { useSearchParams } from 'next/navigation';
import AuthClientWrapper from './auth-client';

export default function SearchParamsWrapper() {
  // Get the search params
  const searchParams = useSearchParams();
  
  // Extract the values you need from searchParams
  const error = searchParams.get('error') || null;
  const redirect = searchParams.get('redirect') || null;
  
  // Pass only the extracted values to AuthClientWrapper
  return <AuthClientWrapper errorMessage={error} redirectUrl={redirect} />;
}
