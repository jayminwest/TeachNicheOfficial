'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error occurred:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="mb-4">Sorry, an unexpected error has occurred.</p>
      <div className="flex gap-4 mt-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
        <a href="/" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
}
