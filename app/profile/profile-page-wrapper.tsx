'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProfilePageClient from './profile-page-client';
import { useSearchParams } from 'next/navigation';

export default function ProfilePageWrapper() {
  // This component exists solely to isolate the useSearchParams hook
  // Force the hook to be called to satisfy Next.js
  useSearchParams();
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading client...</p>
        </div>
      </div>
    }>
      <ProfilePageClient />
    </Suspense>
  );
}
