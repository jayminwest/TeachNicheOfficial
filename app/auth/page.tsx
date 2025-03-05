import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled to avoid useSearchParams issues
const AuthClient = dynamic(() => import('./client'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">Loading...</div>
  ),
});

export default function AuthPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Extract error parameters from the URL
  const errorParam = searchParams.error as string | undefined;
  const messageParam = searchParams.message as string | undefined;
  
  // Process error message on the server side
  let errorMessage: string | null = null;
  
  if (errorParam) {
    if (errorParam === 'callback_failed') {
      errorMessage = messageParam || 'Failed to complete authentication';
    } else if (errorParam === 'no_code') {
      errorMessage = 'No authentication code received';
    } else if (errorParam === 'no_session') {
      errorMessage = 'No session created';
    } else if (errorParam === 'exception') {
      errorMessage = messageParam || 'An unexpected error occurred';
    } else if (errorParam === 'flow_state_expired') {
      errorMessage = 'Your authentication session expired. Please try signing in again.';
    } else {
      errorMessage = `Error: ${errorParam}`;
    }
  }
  
  return <AuthClient errorMessage={errorMessage} />;
}
