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

## Proposed Solution

### 1. Simplify Component Structure

Reduce the number of wrapper components and simplify the authentication flow:

```tsx
// app/auth/page.tsx (Server Component)
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import ClientAuthWrapper from './client-auth-wrapper';

export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground">
            Sign in to access your account and lessons
          </p>
        </div>
        
        <Suspense fallback={
          <div className="space-y-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          </div>
        }>
          <ClientAuthWrapper />
        </Suspense>
      </div>
    </div>
  );
}
```

### 2. Create a Consolidated Client Component

Combine the functionality of multiple wrapper components into a single client component:

```tsx
// app/auth/client-auth-wrapper.tsx (Client Component)
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';
import { CardContent, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth';

export default function ClientAuthWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Extract parameters directly from searchParams hook
  const errorParam = searchParams.get('error');
  const redirect = searchParams.get('redirect');
  
  useEffect(() => {
    // Store redirect URL in session storage
    if (redirect) {
      sessionStorage.setItem('auth-redirect', redirect);
    }
    
    // Set error from URL parameter if present
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    
    // Simulate loading to ensure client hydration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [redirect, errorParam]);
  
  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      
      const { error: signInError } = await signInWithGoogle();
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError instanceof Error ? signInError.message : 'Failed to sign in with Google');
        return;
      }
      
      // Handle successful sign-in
      const redirectUrl = sessionStorage.getItem('auth-redirect');
      if (redirectUrl) {
        sessionStorage.removeItem('auth-redirect');
        router.push(redirectUrl);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Exception during sign in:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSigningIn(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="font-bold">Authentication Error</h3>
          <p>There was a problem with the authentication component.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Refresh Page
          </button>
        </div>
      }
    >
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <Button 
          className="w-full" 
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
        >
          {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
        </p>
      </CardFooter>
    </ErrorBoundary>
  );
}
```

### 3. Apply the Same Pattern to Other Pages

For other pages using client-side hooks like `useSearchParams()`, apply the same pattern:
1. Make the page a server component
2. Wrap client components in Suspense boundaries
3. Use client components for interactive elements
4. Ensure proper loading states

## Implementation Plan

### Phase 1: Fix Auth Page (Priority: High)
- [x] Identify all components in the auth flow
- [x] Simplify component structure
- [x] Add proper Suspense boundaries
- [ ] Test authentication flow
- [ ] Verify build succeeds without errors

### Phase 2: Fix Lesson Pages (Priority: Medium)
- [ ] Identify components using client-side hooks
- [ ] Apply Suspense pattern to lesson pages
- [ ] Test lesson viewing and purchasing
- [ ] Verify build succeeds without errors

### Phase 3: Fix Request Pages (Priority: Medium)
- [ ] Identify components using client-side hooks
- [ ] Apply Suspense pattern to request pages
- [ ] Test request creation and voting
- [ ] Verify build succeeds without errors

### Phase 4: General Cleanup (Priority: Low)
- [ ] Remove unused wrapper components
- [ ] Document the pattern for future development
- [ ] Create reusable Suspense wrapper component if needed
- [ ] Add tests for client-side data fetching

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

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-03-06 | Development Team | Initial issue report |
