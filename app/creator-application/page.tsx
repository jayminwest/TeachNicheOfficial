'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatorApplicationRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/creator-dashboard');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        Redirecting to Creator Dashboard...
      </div>
    </div>
  );
}
