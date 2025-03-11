'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/auth/signin?redirect=/profile');
  }, [router]);
  
  // This element helps with testing
  return <div data-testid="unauthenticated-redirect">Redirecting to login...</div>;
}
