'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { ClientWrapper } from '@/app/components/ui/client-wrapper';

export default function SignInClient() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to auth page after a short delay
    const redirectTimeout = setTimeout(() => {
      router.push('/auth');
    }, 500);
    
    return () => clearTimeout(redirectTimeout);
  }, [router]);
  
  return (
    <ClientWrapper
      loadingMessage="Preparing sign-in page..."
      errorFallback={
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-4">Sign In</h1>
          <div className="p-6 bg-destructive/10 rounded-lg flex flex-col items-center justify-center mb-4">
            <p className="text-lg font-medium">Something went wrong</p>
            <p className="text-muted-foreground mb-4">Please try again or refresh the page</p>
          </div>
          <a 
            href="/auth"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Go to Sign In
          </a>
        </div>
      }
    >
      <div>
        <h1 className="text-4xl font-bold mb-4">Sign In</h1>
        <p className="mb-8">Redirecting to authentication page...</p>
        <Button 
          onClick={() => router.push('/auth')}
          variant="outline"
        >
          Continue to Sign In
        </Button>
      </div>
    </ClientWrapper>
  );
}
