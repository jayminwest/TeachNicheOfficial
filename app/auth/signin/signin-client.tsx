'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Redirect to the main auth page
    router.push('/auth');
  }, [router]);
  
  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">Sign In</h1>
      <p className="mb-8">Redirecting to authentication page...</p>
    </div>
  );
}
