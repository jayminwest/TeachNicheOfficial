import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the client component with no SSR
const RequestsClient = dynamic(() => import('./requests-client'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
});

export default function RequestsPage() {
  return (
    <div className="min-h-screen pt-16">
      <RequestsClient />
      
      <noscript>
        <div className="p-8">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view and interact with lesson requests. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}
