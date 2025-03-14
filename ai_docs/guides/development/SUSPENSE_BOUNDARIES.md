# Using Suspense Boundaries with Client-Side Hooks and Dynamic Route Parameters

## Overview

In Next.js 15+, certain client-side hooks like `useSearchParams()` require Suspense boundaries to handle the loading state properly. Additionally, dynamic route parameters (`params`) are now asynchronous and must be properly awaited before accessing their properties. These requirements ensure proper static generation and server-side rendering capabilities.

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

## Handling Dynamic Route Parameters

In Next.js 15+, dynamic route parameters (`params`) are now asynchronous and must be awaited before accessing their properties. If you try to access them directly (e.g., `params.id`), you'll see this error:

```
Error: Route "/[id]" used `params.id`. `params` should be awaited before using its properties.
Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
```

### Solution: Await the params object

```tsx
// In a server component with dynamic route parameters
async function MyPageContent({ params }: { params: { id: string } }) {
  // Await the params object before accessing its properties
  const { id } = await params;
  
  // Now you can use the id safely
  return <MyComponent id={id} />;
}
```

### Example Implementation

Here's a complete example of how we implemented this pattern in a dynamic route:

```tsx
// app/lessons/[id]/page.tsx
export default function LessonPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<LoadingUI />}>
      <LessonPageContent params={params} />
    </Suspense>
  );
}

// Separate async component to handle data fetching
async function LessonPageContent({ params }: { params: { id: string } }) {
  try {
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get session
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    // Await the params object before accessing its properties
    const { id } = await params;
    
    return <LessonPageClient lessonId={id} session={session} />;
  } catch (error) {
    console.error('Error in lesson page:', error);
    notFound();
    return null;
  }
}
```

The same pattern applies to API routes:

```tsx
// app/api/lessons/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Await the params object before accessing its properties
    const { id } = await params;
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      // ...rest of the function
  }
}
```

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
- [Next.js Documentation: Dynamic APIs are Asynchronous](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [React Documentation: Suspense](https://react.dev/reference/react/Suspense)
- [Next.js App Router: Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
