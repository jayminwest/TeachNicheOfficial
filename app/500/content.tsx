'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Custom500Content() {
  const [isClient, setIsClient] = useState(false);
  // This is the hook that's causing the issue
  const searchParams = useSearchParams();
  
  useEffect(() => {
    setIsClient(true);
    // We can use searchParams here if needed
    // const errorCode = searchParams.get('code');
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">500 - Server Error</h1>
      <p className="mb-8">Sorry, something went wrong on our server.</p>
      {isClient ? (
        <button 
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Return to Home
        </button>
      ) : (
        <a 
          href="/" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Return to Home
        </a>
      )}
    </div>
  );
}
