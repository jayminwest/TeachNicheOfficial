'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Use dynamic import with SSR disabled to avoid useSearchParams issues
const AuthClient = dynamic(() => import('./client'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">Loading...</div>
  ),
});

interface AuthClientWrapperProps {
  errorMessage: string | null;
}

export default function AuthClientWrapper({ errorMessage }: AuthClientWrapperProps) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthClient errorMessage={errorMessage} />
    </Suspense>
  );
}
