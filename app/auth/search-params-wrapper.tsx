'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthClientWrapper from './auth-client';

// This component should only be rendered inside a Suspense boundary
export default function SearchParamsWrapper() {
  // Get the search params
  const searchParams = useSearchParams();
  
  // Extract the values you need from searchParams
  const error = searchParams.get('error') || null;
  const redirect = searchParams.get('redirect') || null;
  const showSignIn = searchParams.get('signin') === 'true';
  
  // Pass only the extracted values to AuthClientWrapper
  return (
    <AuthClientWrapper 
      errorMessage={error} 
      redirectUrl={redirect}
      showSignIn={showSignIn}
    />
  );
}
