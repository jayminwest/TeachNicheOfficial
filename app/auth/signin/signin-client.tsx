'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';

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
  );
}
