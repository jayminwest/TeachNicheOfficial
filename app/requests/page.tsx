export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { RequestsPage } from './components/requests-page';
import { SearchParamsWrapper } from '@/app/components/ui/search-params-wrapper';

export default function Page() {
  return (
    <div className="min-h-screen pt-16">
      <SearchParamsWrapper fallback={
        <div className="container mx-auto p-4">
          <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded-md mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 w-full bg-muted animate-pulse rounded-md"></div>
            ))}
          </div>
        </div>
      }>
        <RequestsPage />
      </SearchParamsWrapper>
    </div>
  );
}
