'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AuthClient from './client';

export default function AuthClientWrapper() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    // Check for error in URL parameters
    const error = searchParams.get('error');
    if (error) {
      setErrorMessage(decodeURIComponent(error));
    }
    
    // Check for redirect parameter
    const redirect = searchParams.get('redirect');
    if (redirect) {
      // Store redirect URL in session storage to use after sign-in
      sessionStorage.setItem('auth-redirect', redirect);
    }
    
    // Simulate loading to ensure client hydration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchParams]);
  
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
  
  return <AuthClient 
    errorMessage={errorMessage} 
    onSuccess={handleSignInSuccess}
  />;
}
