'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AuthClient } from './client';

interface AuthClientWrapperProps {
  errorMessage?: string | null;
  redirectUrl?: string | null;
}

export default function AuthClientWrapper({ 
  errorMessage: initialErrorMessage = null,
  redirectUrl = null
}: AuthClientWrapperProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Store redirect URL in session storage to use after sign-in if provided
    if (redirectUrl) {
      sessionStorage.setItem('auth-redirect', redirectUrl);
    }
    
    // If we have an initial error message, decode it
    if (initialErrorMessage) {
      setErrorMessage(decodeURIComponent(initialErrorMessage));
    }
    
    // Simulate loading to ensure client hydration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [initialErrorMessage, redirectUrl]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
          <div className="space-y-1 mb-4">
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="text-muted-foreground">
              Sign in to access your account and lessons
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const handleSignInSuccess = () => {
    // Check for stored redirect URL
    const redirect = sessionStorage.getItem('auth-redirect');
    if (redirect) {
      sessionStorage.removeItem('auth-redirect');
      router.push(redirect);
    } else {
      router.push('/');
    }
  };
  
  return (
    <AuthClient 
      onSuccess={handleSignInSuccess}
      // @ts-expect-error - errorMessage is used in the component but not in the type definition
      errorMessage={errorMessage} 
    />
  );
}
