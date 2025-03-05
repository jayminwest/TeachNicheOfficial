import { Suspense } from 'react';
import SignInClient from './signin-client';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <Suspense fallback={
        <div className="animate-pulse">
          <h1 className="text-4xl font-bold mb-4">Sign In</h1>
          <p className="mb-8">Loading sign in options...</p>
        </div>
      }>
        <SignInClient />
      </Suspense>
      
      <noscript>
        <div className="mt-8 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          JavaScript is required to sign in. Please enable JavaScript or use a browser that supports it.
        </div>
      </noscript>
    </div>
  );
}
