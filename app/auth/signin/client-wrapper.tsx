'use client';

// Avoid importing any hooks that might use useSearchParams
import { useEffect, useState } from 'react';

// Simple component that doesn't use any router hooks
const SignInContent = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
    <h1 className="text-4xl font-bold mb-4">Sign In</h1>
    <p className="mb-8">Please sign in to continue.</p>
    <a 
      href="/auth" 
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
    >
      Go to Sign In
    </a>
  </div>
);

export default function SignInClientWrapper() {
  // Use client-side only rendering with a simpler approach
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Return null on server, render on client only
  if (!mounted) {
    return null;
  }
  
  return <SignInContent />;
}
