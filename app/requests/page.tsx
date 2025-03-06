export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import SearchParamsWrapper from './search-params-wrapper';
// Static page component that doesn't use any client hooks
export default function RequestsPage() {
  return (
    <div className="min-h-screen pt-16">
      
      
      <Suspense fallback={(
        <div className="container p-8 space-y-6">
          <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-md"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[120px] w-full bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      )}>
        <SearchParamsWrapper />
      </Suspense>
    </div>
  );
}
