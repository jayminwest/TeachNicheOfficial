'use client';

import { Suspense, ReactNode } from 'react';

interface SearchParamsWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A wrapper component that provides a Suspense boundary for components
 * that use client-side data fetching hooks like useSearchParams().
 * 
 * This component should be used in server components when rendering
 * client components that use these hooks.
 * 
 * @example
 * ```tsx
 * // In a server component
 * import { SearchParamsWrapper } from '@/app/components/ui/search-params-wrapper';
 * import ClientComponent from './client-component';
 * 
 * export default function ServerComponent() {
 *   return (
 *     <SearchParamsWrapper>
 *       <ClientComponent />
 *     </SearchParamsWrapper>
 *   );
 * }
 * ```
 */
export function SearchParamsWrapper({ 
  children, 
  fallback = <div className="w-full h-32 bg-muted animate-pulse rounded-md" />
}: SearchParamsWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}
