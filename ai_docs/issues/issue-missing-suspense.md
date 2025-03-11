# Issue: Simplify Suspense Usage to Prevent Missing Suspense Errors

## Description
Our codebase currently wraps certain components with Suspense and ErrorBoundary wrappers even though they avoid directly using `useSearchParams()`. This extra nesting may cause unexpected "Missing Suspense boundary with useSearchParams" errors, forcing the page into client-side rendering. We need to simplify these files to remove unnecessary wrappers.

## Affected Files
- `app/requests/page.tsx`
- `app/auth/auth-client-wrapper.tsx`
- `app/auth/search-params-wrapper.tsx`
- `app/lessons/page.tsx`

## Proposed Changes
- Remove unnecessary Suspense and ErrorBoundary wrappers, since the components already handle search parameters without using `useSearchParams()` directly.
- Ensure the affected pages render immediately without waiting for client-side hydration.

## Steps to Validate
1. Run the build command: `npm run build`  
2. Verify that no warnings or errors related to missing Suspense boundaries occur.
3. Check the functionality and rendering of the affected pages.

## Additional Context
Refer to the Next.js documentation: [Missing Suspense boundary with useSearchParams](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) for further details.

## Environment
- Next.js Version: 15.1.7  
- Platform: macOS-14.4-arm64-arm-64bit

---
