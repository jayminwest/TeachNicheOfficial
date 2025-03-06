import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the client component with no SSR
const LessonsClient = dynamic(() => import('./lessons-client'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
});

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <LessonsClient />
      </div>
      
      <noscript>
        <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view lessons. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}
