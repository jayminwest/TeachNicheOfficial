# Missing Suspense Boundary with useSearchParams in Next.js App Router

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

The issue is occurring in the `/auth` route, but may be present in other routes as well.

## Reproduction Steps

1. Run `vercel build` or `npm run build`
2. Observe the build failure with the error message about missing Suspense boundaries
3. The error specifically mentions the `/auth` page

## Expected Behavior

The build process should complete successfully, with all pages that use `useSearchParams()` properly wrapped in Suspense boundaries to maintain static generation capabilities.

## Environment Details

- Next.js Version: 15.1.7
- React Version: 19.0.0
- Node.js Version: Current LTS
- Platform: macOS-14.4-arm64-arm-64bit

## Affected Files

Based on the error message, the following files are likely affected:
- `/app/auth/page.tsx` or related client components used in this page
- Any other client components that use `useSearchParams()` without Suspense boundaries

## Proposed Solution

The solution requires wrapping all components that use `useSearchParams()` in Suspense boundaries:

```tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Component that uses search params
function SearchParamsComponent() {
  const searchParams = useSearchParams()
  // Component logic
  return <div>...</div>
}

// Parent component with Suspense boundary
export function ParentComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsComponent />
    </Suspense>
  )
}
```

## Additional Context

According to Next.js documentation, this is a requirement in Next.js 15+ to ensure proper static generation and server-side rendering capabilities. Without Suspense boundaries, components using `useSearchParams()` force client-side rendering, which conflicts with static generation during the build process.

## Testing Requirements

After implementing the fix:
1. Verify the build completes successfully
2. Ensure all pages render correctly, including with URL parameters
3. Confirm that server-side rendering and static generation work as expected
