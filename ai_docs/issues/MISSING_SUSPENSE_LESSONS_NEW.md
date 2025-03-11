# Issue Report: Missing Suspense Boundary in Lessons/New Page

## Issue Description

The `/lessons/new` page is currently implemented as a static page with client-side JavaScript loading via a script tag. This approach was likely a temporary workaround to avoid the suspense boundary issues with hooks like `useSearchParams()` in Next.js App Router. However, this implementation has several limitations:

1. It breaks the React component model by using vanilla JavaScript
2. It lacks proper integration with Next.js features like server components and suspense
3. It may cause build errors if client components use hooks like `useSearchParams()`
4. It creates a disjointed user experience with separate loading of JavaScript

The page needs to be refactored to follow the established pattern used in other parts of the application (like `/auth` and `/auth/signin`) where client components are properly wrapped in suspense boundaries to prevent de-optimization to client-side rendering during the build process.

### Technical Analysis

The current implementation in `/lessons/new/page.tsx`:
1. Uses `export const dynamic = 'force-static'` to ensure static generation
2. Renders a skeleton UI with loading animation
3. Loads client-side JavaScript (`new-lesson-client.js`) after the page loads using a script tag
4. Implements form functionality, video upload, and API interactions in vanilla JavaScript

This approach has several issues:
- It doesn't leverage React's component model and hooks
- Error handling is inconsistent with the rest of the application
- Authentication checks are duplicated rather than using existing hooks
- Form validation is manual rather than using schema validation with Zod
- The user experience is inconsistent with other parts of the application
- It may cause build errors if the client-side code eventually uses hooks like `useSearchParams()`

The current client-side JavaScript (`new-lesson-client.js`) handles:
1. Authentication checks
2. Form rendering and submission
3. Video upload to Mux
4. Error and success toast notifications
5. API interactions

Other pages in the application (like `/auth/signin`) use a client wrapper pattern that:
1. Properly handles client-side rendering with suspense boundaries
2. Maintains the React component model
3. Provides better error handling through the `ErrorBoundary` component
4. Handles loading states consistently

## Reproduction Steps

1. Run `vercel build` or `npm run build`
2. Observe potential build failures related to the `/lessons/new` page
3. Navigate to `/lessons/new` in the browser
4. Observe that the page loads with a skeleton UI
5. Client-side JavaScript is loaded separately after page load
6. This creates a disjointed user experience compared to other pages

## Expected Behavior

The `/lessons/new` page should:
1. Follow the established pattern of using client wrappers with proper suspense boundaries
2. Maintain the React component model
3. Provide a consistent user experience with the rest of the application
4. Handle loading states and errors properly using the existing `ErrorBoundary` component
5. Build successfully without suspense-related errors
6. Use React components for form handling, video upload, and API interactions

## Environment Details

- Next.js Version: 15.1.7
- React Version: 19.0.0
- Node.js Version: Current LTS

## Affected Files

- `/app/lessons/new/page.tsx` - Current static implementation
- `/public/new-lesson-client.js` - Client-side JavaScript (referenced in the page)

## Proposed Solution

The solution requires refactoring the page to follow the client wrapper pattern used in other parts of the application:

1. Create a new lesson form component that implements the functionality from `new-lesson-client.js`
2. Create a new client component that wraps the form with proper suspense boundaries
3. Create a client wrapper component similar to the one used in `/auth/signin/client-wrapper.tsx`
4. Update the page component to use the client wrapper

This approach will:
- Maintain all the functionality of the current implementation
- Follow the React component model
- Use proper suspense boundaries to prevent build errors
- Provide consistent error handling with the rest of the application
- Improve the user experience with proper loading states
- Use the existing toast component for notifications

## Additional Context

This issue is similar to the one described in the `ISSUE_REPORT.md` about missing suspense boundaries with `useSearchParams()`. The solution follows the same pattern used in the `/auth` and `/auth/signin` pages, which properly handle client-side rendering with suspense boundaries.

The implementation should leverage the existing `ErrorBoundary` component to provide consistent error handling across the application. This approach ensures that any errors in the form component are properly caught and displayed to the user.

According to Next.js documentation, components that use hooks like `useSearchParams()` need to be wrapped in Suspense boundaries to ensure proper static generation and server-side rendering capabilities. Without Suspense boundaries, these components force client-side rendering, which conflicts with static generation during the build process.

## Testing Requirements

After implementing the fix:
1. Verify the build completes successfully without suspense-related errors
2. Ensure the lesson creation form renders correctly
3. Test form submission and validation
4. Test video upload functionality
5. Confirm that error handling works properly using the `ErrorBoundary` component
6. Test authentication flow and redirects
7. Verify that the user experience is consistent with other parts of the application
