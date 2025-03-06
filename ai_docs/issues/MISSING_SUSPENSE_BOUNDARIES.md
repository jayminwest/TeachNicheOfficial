# Issue Report: Missing Suspense Boundaries with useSearchParams in Next.js App Router

## Issue Description

During the build process, Next.js is failing with an error related to missing Suspense boundaries around `useSearchParams()` hooks. This causes pages to de-optimize to client-side rendering, preventing static generation and breaking the build process.

### Error Message
```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/auth". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
Error occurred prerendering page "/auth". Read more: https://nextjs.org/docs/messages/prerender-error
Export encountered an error on /auth/page: /auth, exiting the build.
```

### Technical Analysis

This error occurs because:
1. The `useSearchParams()` hook is being used in client components without being wrapped in a Suspense boundary
2. This forces Next.js to fall back to client-side rendering for the entire page
3. During static generation at build time, this creates a conflict that breaks the build process

The issue is occurring in the `/auth` route, but may be present in other routes as well that use client-side data fetching hooks.

## Affected Files

Based on the error message and code analysis, the following files are affected:
- `/app/auth/page.tsx` - Main auth page that needs Suspense boundaries
- `/app/auth/client-auth-wrapper.tsx` - Client component using useSearchParams
- `/app/auth/search-params-wrapper.tsx` - Component attempting to handle search params
- `/app/auth/client-wrapper.tsx` - Wrapper component for auth client
- `/app/auth/client.tsx` - Auth client implementation

Other potential areas affected:
- `/app/lessons/[id]/page.tsx` and related components
- Any other pages using useSearchParams or similar client-side data fetching hooks

## Root Cause

In Next.js 15+, certain client-side hooks like `useSearchParams()` require Suspense boundaries to handle the loading state properly. This is a requirement to ensure proper static generation and server-side rendering capabilities.

The current implementation has several issues:
1. Overly complex component hierarchy with multiple wrapper components
2. Missing Suspense boundaries around components using client-side hooks
3. Inefficient handling of URL parameters with unnecessary state management

## Implementation Status

### Phase 1: Fix Auth Page (Priority: High) ✅
- [x] Identified all components in the auth flow
- [x] Simplified component structure
- [x] Added proper Suspense boundaries
- [x] Implemented direct useSearchParams() usage within Suspense boundary
- [x] Converted page.tsx to a server component
- [x] Removed redundant client-auth-wrapper.tsx component
- [x] Enhanced AuthClient component with proper error handling
- [x] Added comprehensive loading states
- [x] Tested authentication flow with various scenarios
- [x] Verified build succeeds without errors

### Phase 2: Fix Lesson Pages (Priority: Medium) ✅
- [x] Identified components using client-side hooks
- [x] Applied Suspense pattern to lesson pages
- [x] Added Suspense boundary to lesson detail page
- [x] Tested lesson viewing functionality
- [x] Verified build succeeds without errors

### Phase 3: Fix Request Pages (Priority: High) ✅
- [x] Identified components using client-side hooks
- [x] Created RequestsPage client component with proper search params handling
- [x] Added Suspense boundary to requests page
- [x] Implemented proper error handling for request components
- [x] Tested request creation and voting with various scenarios
- [x] Verified build succeeds without errors

### Phase 4: General Cleanup (Priority: High) ✅
- [x] Removed redundant wrapper components
- [x] Created reusable SearchParamsWrapper component
- [x] Added comprehensive tests for client-side data fetching
- [x] Documented the pattern for future development
- [x] Added detailed JSDoc comments to the SearchParamsWrapper component
- [x] Created test suite for SearchParamsWrapper component

## Solution Implemented

### 1. Simplified Component Structure

The auth page was converted to a server component with proper Suspense boundaries:

```tsx
// app/auth/page.tsx (Server Component)
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import AuthClient from './client';

export default function AuthPage() {
  return (
    <Suspense fallback={
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
    </Suspense>
  );
}
```

### 2. Enhanced Client Component with Proper Error Handling

The AuthClient component now properly uses useSearchParams within a Suspense boundary:

```tsx
// app/auth/client.tsx (Client Component)
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';

export default function AuthClient({ onSuccess }: AuthClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Extract parameters directly from searchParams hook
  const errorParam = searchParams.get('error');
  const redirect = searchParams.get('redirect');
  
  // ... rest of component implementation
}
```

### 3. Created a Reusable SearchParamsWrapper Component

A reusable wrapper component was created to simplify adding Suspense boundaries:

```tsx
// app/components/ui/search-params-wrapper.tsx
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
  fallback = <div className="w-full h-10 bg-muted animate-pulse rounded-md" />
}: SearchParamsWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}
```

### 5. Implemented Requests Page with Proper Suspense Boundaries

The requests page was updated to use Suspense boundaries:

```tsx
// app/requests/page.tsx
import { Suspense } from 'react';
import { RequestsPage } from './components/requests-page';

export default function Page() {
  return (
    <Suspense fallback={
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
    </Suspense>
  );
}
```

A dedicated client component was created to handle the requests page logic:

```tsx
// app/requests/components/requests-page.tsx
'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RequestGrid } from './request-grid';
import { RequestSidebar } from './request-sidebar';
import { Button } from '@/app/components/ui/button';
import { Menu } from 'lucide-react';

export function RequestsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Extract query parameters
  const categoryParam = searchParams.get('category');
  const sortByParam = searchParams.get('sort') as 'popular' | 'newest' | undefined;
  
  // Set default sort if not provided
  const sortBy = sortByParam || 'popular';
  
  // Handle category selection
  const handleCategorySelect = (category?: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    
    router.push(`/requests?${params.toString()}`);
  };
  
  // Handle sort change
  const handleSortChange = (sort: 'popular' | 'newest') => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    router.push(`/requests?${params.toString()}`);
  };
  
  // ... rest of component implementation
}
```

### 4. Applied the Same Pattern to Lesson Pages

The lesson detail page now uses Suspense boundaries:

```tsx
// app/lessons/[id]/page.tsx
import { Suspense } from 'react';
import LessonDetail from "./lesson-detail";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { id: string } }) {
  // ... existing code
  
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4">
        <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded-md mb-4"></div>
        <div className="h-64 w-full bg-muted animate-pulse rounded-md"></div>
      </div>
    }>
      <LessonDetail id={lessonId} session={session} />
    </Suspense>
  );
}
```

## Implementation Complete ✅

All phases of the implementation have been completed:

1. ✅ Fixed auth page with proper Suspense boundaries
2. ✅ Fixed lesson pages with proper Suspense boundaries
3. ✅ Fixed request pages with proper Suspense boundaries
4. ✅ Created reusable SearchParamsWrapper component
5. ✅ Added comprehensive tests for client-side data fetching
6. ✅ Documented the pattern for future development
7. ✅ Added test suite for SearchParamsWrapper component
8. ✅ Created RequestsPage client component for better organization

The implementation follows Next.js best practices for handling client-side data fetching hooks and ensures proper static generation capabilities throughout the application.

## Testing Requirements

After implementing the fix:
1. Verify the build completes successfully with `vercel build`
2. Test authentication flow with various scenarios:
   - Sign in with Google
   - Sign in with redirect URL
   - Error handling
3. Test navigation between pages
4. Verify server-side rendering and static generation work as expected
5. Test on mobile devices to ensure responsive behavior

## Additional Resources

- [Next.js Documentation: Missing Suspense with CSR Bailout](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout)
- [React Documentation: Suspense](https://react.dev/reference/react/Suspense)
- [Next.js App Router: Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

## Best Practices for Using Client-Side Hooks in Next.js

When using client-side hooks like `useSearchParams()` in Next.js 15+, follow these best practices:

1. **Always Use Suspense Boundaries**: Wrap any component that uses client-side data fetching hooks in a Suspense boundary.

2. **Keep Client Components Focused**: Client components that use these hooks should have a single responsibility.

3. **Provide Meaningful Fallbacks**: Design fallback UI that matches the shape and size of the actual content to prevent layout shifts.

4. **Use Error Boundaries**: Combine Suspense with ErrorBoundary to handle both loading and error states.

5. **Consider Using the SearchParamsWrapper**: For consistency, use the provided SearchParamsWrapper component when adding new features.

Example usage:

```tsx
// In a server component
import { SearchParamsWrapper } from '@/app/components/ui/search-params-wrapper';
import ClientComponent from './client-component';

export default function ServerComponent() {
  return (
    <SearchParamsWrapper fallback={<CustomLoadingState />}>
      <ClientComponent />
    </SearchParamsWrapper>
  );
}
```

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-03-06 | Development Team | Initial issue report |
| 1.1 | 2025-03-06 | Development Team | Updated with implementation status |
| 1.2 | 2025-03-06 | Development Team | Updated with completed implementation |
| 1.3 | 2025-03-06 | Development Team | Added best practices and updated solution details |
| 1.4 | 2025-03-06 | Development Team | Updated with requests page implementation details |
