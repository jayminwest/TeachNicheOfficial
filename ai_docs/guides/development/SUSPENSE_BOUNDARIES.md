# Using Suspense Boundaries with Client-Side Hooks

## Overview

In Next.js 15+, certain client-side hooks like `useSearchParams()` require Suspense boundaries to handle the loading state properly. This is a requirement to ensure proper static generation and server-side rendering capabilities.

## The Problem

When using hooks like `useSearchParams()` without a Suspense boundary, Next.js will show an error like:

```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/auth". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
```

This happens because these hooks force client-side rendering, which conflicts with static generation during the build process.

## The Solution

### 1. Split Components into Server and Client Parts

Separate your page into server and client components:

```tsx
// page.tsx (Server Component)
import { Suspense } from 'react';
import ClientComponent from './client';

export default function Page() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <ClientComponent />
    </Suspense>
  );
}
```

```tsx
// client.tsx (Client Component)
'use client';

import { useSearchParams } from 'next/navigation';

export default function ClientComponent() {
  const searchParams = useSearchParams();
  // Use searchParams safely here
  return <div>...</div>;
}
```

### 2. Use the SearchParamsWrapper Component

For consistency, use our `SearchParamsWrapper` component:

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

## Best Practices

1. **Always Use Suspense Boundaries**: Wrap any component that uses client-side data fetching hooks in a Suspense boundary.

2. **Keep Client Components Focused**: Client components that use these hooks should have a single responsibility.

3. **Provide Meaningful Fallbacks**: Design fallback UI that matches the shape and size of the actual content to prevent layout shifts.

4. **Use Error Boundaries**: Combine Suspense with ErrorBoundary to handle both loading and error states.

## Common Hooks Requiring Suspense

- `useSearchParams()`
- `usePathname()`
- `useRouter()`
- `useSelectedLayoutSegment()`
- `useSelectedLayoutSegments()`

## Example Implementation

Here's a complete example of how we implemented this pattern in the auth page:

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

```tsx
// app/auth/client.tsx (Client Component)
'use client';

import { useSearchParams } from 'next/navigation';
// ... other imports

export default function AuthClient() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const redirect = searchParams.get('redirect');
  
  // Rest of component implementation
}
```

## Additional Resources

- [Next.js Documentation: Missing Suspense with CSR Bailout](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout)
- [React Documentation: Suspense](https://react.dev/reference/react/Suspense)
- [Next.js App Router: Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
