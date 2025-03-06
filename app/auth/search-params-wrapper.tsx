'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import AuthClientWrapper from './auth-client';

export default function SearchParamsWrapper() {
  // Initialize with null values
  const [params, setParams] = useState<{error: string | null, redirect: string | null}>({
    error: null,
    redirect: null
  });
  
  // Get search params safely on the client side
  useEffect(() => {
    // Get the search params
    const searchParams = new URLSearchParams(window.location.search);
    
    // Extract the values you need from searchParams
    const error = searchParams.get('error') || null;
    const redirect = searchParams.get('redirect') || null;
    
    // Update state with the extracted values
    setParams({ error, redirect });
  }, []);
  
  // Pass only the extracted values to AuthClientWrapper
  return <AuthClientWrapper errorMessage={params.error} redirectUrl={params.redirect} />;
}
