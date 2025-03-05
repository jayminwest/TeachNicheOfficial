import { Suspense } from 'react';
import SignInClientWrapper from './client-wrapper';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">Loading...</div>}>
      <SignInClientWrapper />
    </Suspense>
  );
}
