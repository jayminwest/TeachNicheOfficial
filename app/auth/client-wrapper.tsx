'use client';

import { useEffect, useState } from 'react';
import AuthClient from './client';

interface AuthClientWrapperProps {
  errorMessage: string | null;
}

export default function AuthClientWrapper({ errorMessage }: AuthClientWrapperProps) {
  // Use client-side only rendering
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  return <AuthClient errorMessage={errorMessage} />;
}
