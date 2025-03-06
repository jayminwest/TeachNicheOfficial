# Issue Report: Infinite API Calls in Lessons Page

## Issue Description

The lessons page is making repeated API calls to `/api/lessons` in an infinite loop, causing excessive server load and potential performance issues for users. The API endpoint is being called repeatedly even after the initial data has been loaded. The lessons are being retrieved correctly and are visible to the user, but only for a split second before the page refreshes again, creating a poor user experience.

### Error Pattern
```
Using direct Supabase client for lessons API
Lesson schema sample: ['id', 'title', 'description', 'price', 'thumbnail_url', 'creator_id']
GET /api/lessons 200 in 75ms
Using direct Supabase client for lessons API
Lesson schema sample: ['id', 'title', 'description', 'price', 'thumbnail_url', 'creator_id']
GET /api/lessons 200 in 63ms
```

This pattern continues indefinitely, with new API calls being made approximately every few seconds.

## Technical Analysis

This issue is occurring because:

1. The `useEffect` hook in `lessons-client.tsx` has a dependency on `retryCount` which is causing re-renders
2. The component is re-fetching data on each re-render due to how the effect dependencies are configured
3. The current fix attempted to limit fetching based on `retryCount === 0`, but this condition is not sufficient

The root cause appears to be in the component's state management and effect dependencies. Despite previous attempts to fix this issue (commit 19d141d), the problem persists.

## Reproduction Steps

1. Navigate to the lessons page
2. Open the browser's developer tools and observe the Network tab
3. Notice continuous API calls to `/api/lessons` endpoint
4. Check the console to see repeated log messages about fetching lessons

## Expected Behavior

The lessons page should:
1. Make a single API call to `/api/lessons` when the component mounts
2. Only make additional API calls when explicitly triggered by user actions (e.g., clicking a retry button)
3. Not continuously poll or re-fetch data without user interaction

## Environment Details

- Next.js Version: 15.1.7
- React Version: 19.0.0
- Node.js Version: Current LTS
- Platform: macOS-14.4-arm64-arm-64bit

## Affected Files

Based on the error logs and code analysis, the following files are involved:

- `/app/lessons/lessons-client.tsx` - The client component making the API calls
- `/app/api/lessons/route.ts` - The API route being called repeatedly

## Proposed Solution

The solution requires a more comprehensive fix to the `lessons-client.tsx` file:

1. Remove `retryCount` from the `useEffect` dependencies array
2. Move the `fetchLessons` function outside the `useEffect` and memoize it with `useCallback`
3. Add a ref to track if the initial fetch has been performed
4. Implement proper cleanup to prevent memory leaks
5. Add more detailed logging in development mode to track component lifecycle

```tsx
// Example fix for lessons-client.tsx
import { useEffect, useState, useCallback, useRef } from 'react';

// Inside component:
const hasInitialFetchRef = useRef(false);

const fetchLessons = useCallback(async () => {
  // Existing fetch logic
}, []);

useEffect(() => {
  // Don't fetch if not mounted or already fetched
  if (!mounted || hasInitialFetchRef.current) return;
  
  hasInitialFetchRef.current = true;
  fetchLessons();
  
  return () => {
    // Cleanup
  };
}, [mounted, fetchLessons]);
```

## Additional Context

This issue is particularly important to fix because:

1. It creates unnecessary load on the Supabase database
2. It may count against API rate limits
3. It degrades user experience with constant network activity
4. It could lead to increased costs due to excessive database operations

## Testing Requirements

After implementing the fix:
1. Verify the lessons page makes only one API call on initial load
2. Confirm that navigating away and back to the page results in a single new API call
3. Ensure the retry functionality still works correctly when triggered by the user
4. Check that no memory leaks occur by monitoring memory usage in Chrome DevTools

## Priority

**High** - This issue affects all users of the lessons page and creates unnecessary server load.

## Related Issues

- Previous fix attempt in commit 19d141d with commit message: "fix: Prevent infinite API calls in lessons page by optimizing fetch logic"
