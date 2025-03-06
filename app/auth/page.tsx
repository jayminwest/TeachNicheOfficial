// Server component
export const dynamic = 'force-dynamic';
import AuthClient from './client';
import { SearchParamsWrapper } from '@/app/components/ui/search-params-wrapper';

export default function AuthPage() {
  return (
    <SearchParamsWrapper fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
          <div className="space-y-1 mb-4">
            <div className="h-8 w-48 bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded-md"></div>
          </div>
          <div className="space-y-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
      </div>
    }>
      <AuthClient />
    </SearchParamsWrapper>
  );
}
