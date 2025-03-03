'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/profile');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to profile...</p>
    </div>
  );
}
