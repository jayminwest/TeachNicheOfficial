'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthClient from './client';

export default function AuthClientWrapper() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for error in URL parameters
    const error = searchParams.get('error');
    if (error) {
      setErrorMessage(decodeURIComponent(error));
    }
  }, [searchParams]);
  
  return <AuthClient errorMessage={errorMessage} />;
}
