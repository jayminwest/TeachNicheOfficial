# Authentication Testing Implementation Plan

## Issue Description

Our authentication system currently lacks comprehensive test coverage across all components and flows. Additionally, there's a critical issue with missing Suspense boundaries around `useSearchParams()` hooks that's causing build failures:

```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/auth". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
```

This error occurs during the build process and prevents static generation, breaking the build. While we have some tests for Suspense boundaries and authentication components, we need to ensure all components using `useSearchParams()` are properly wrapped in Suspense boundaries and that our authentication system is thoroughly tested.

## Technical Analysis

After reviewing the codebase and existing tests, I've identified several areas that need attention:

1. **Missing Suspense Boundaries**: Several components use `useSearchParams()` without being wrapped in a Suspense boundary:
   - `app/components/ui/auth-dialog.tsx` - Uses `useSearchParams` directly
   - `app/components/ui/sign-in.tsx` - Uses `useSearchParams` directly
   - `app/auth/client.tsx` - Uses `useSearchParams` indirectly

2. **Incomplete Test Coverage**: While there are tests for some authentication components, others lack coverage:
   - No comprehensive tests for `app/services/auth/AuthContext.tsx`
   - Limited tests for `app/services/auth/supabaseAuth.ts` functions
   - No E2E tests for complete authentication flows
   - Limited tests for error handling scenarios

3. **Existing Tests**: We have good tests for:
   - Suspense boundaries with `useSearchParams()` in `app/__tests__/components/suspense-boundary.test.tsx`
   - Basic rendering of auth components in `app/__tests__/auth/page.test.tsx`
   - Client-auth-wrapper functionality in `app/__tests__/auth/client-auth-wrapper.test.tsx`
   - Suspense with auth components in `app/__tests__/auth/auth-suspense.test.tsx`

## Proposed Solution

Build on the existing tests to implement a comprehensive testing strategy:

1. **Fix Suspense Boundary Issues**:
   - Ensure all components using `useSearchParams()` are wrapped in Suspense boundaries
   - Use the patterns established in `app/__tests__/components/suspense-wrapper.tsx` and `app/__tests__/components/suspense-boundary.test.tsx`

2. **Complete Test Coverage**:
   - Add comprehensive tests for `app/services/auth/AuthContext.tsx`
   - Add tests for all `app/services/auth/supabaseAuth.ts` functions
   - Implement E2E tests for authentication flows
   - Add tests for error handling scenarios

## Implementation Plan

### Phase 1: Fix Suspense Boundary Issues

1. **Update `app/components/ui/auth-dialog.tsx`**:
   - Refactor to use a pattern similar to `app/__tests__/components/suspense-wrapper.tsx`
   - Extract the component that uses `useSearchParams` and wrap it in Suspense

   ```tsx
   // Example implementation
   'use client'

   import { useEffect, useState, Suspense } from 'react'
   import { Dialog, DialogContent, DialogTitle } from './dialog'
   import { SignInPage } from './sign-in'
   import { useAuth } from '@/app/services/auth/AuthContext'

   // Component that uses useSearchParams
   function AuthDialogContent({ 
     onOpenChange, 
     onSuccess,
     defaultView = 'sign-in'
   }) {
     const { isAuthenticated, loading, error: authError } = useAuth()
     const [error, setError] = useState<string | null>(null)
     const [view] = useState(defaultView)
     const searchParams = useSearchParams()
     const [redirectPath, setRedirectPath] = useState<string | null>(null)
     
     // Rest of the component logic...
     
     return (
       // Component JSX...
     )
   }

   export function AuthDialog(props) {
     return (
       <Dialog open={props.open} onOpenChange={props.onOpenChange}>
         <DialogContent className="p-0 w-[425px]" data-testid="auth-dialog">
           <DialogTitle className="px-6 pt-6" data-testid="auth-dialog-title">
             Sign in to Teach Niche
           </DialogTitle>
           <Suspense fallback={
             <div className="p-6 flex justify-center" data-testid="auth-suspense-loading">
               <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
             </div>
           }>
             <AuthDialogContent {...props} />
           </Suspense>
         </DialogContent>
       </Dialog>
     )
   }
   ```

2. **Update `app/components/ui/sign-in.tsx`**:
   - Apply the same pattern to ensure `useSearchParams` is used within a Suspense boundary

3. **Update `app/auth/client.tsx`**:
   - Apply the same pattern to ensure `useSearchParams` is used within a Suspense boundary

### Phase 2: Complete Authentication Service Tests

1. **Create comprehensive tests for `app/services/auth/supabaseAuth.ts`**:
   - Create file: `app/services/auth/__tests__/supabaseAuth.test.ts`
   - Test all exported functions: `signInWithGoogle`, `signOut`, `getSession`, `onAuthStateChange`
   - Test error handling, especially for cookie-related errors
   - Test edge cases and error scenarios

   ```typescript
   // Example test structure
   import { signInWithGoogle, signOut, getSession, onAuthStateChange } from '../supabaseAuth';
   import { createClientSupabaseClient } from '@/app/lib/supabase/client';

   jest.mock('@/app/lib/supabase/client', () => ({
     createClientSupabaseClient: jest.fn(),
   }));

   describe('supabaseAuth', () => {
     const mockSupabaseClient = {
       auth: {
         signInWithOAuth: jest.fn(),
         signOut: jest.fn(),
         getSession: jest.fn(),
         onAuthStateChange: jest.fn(),
       },
     };

     beforeEach(() => {
       jest.clearAllMocks();
       (createClientSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
     });

     describe('signInWithGoogle', () => {
       it('returns success when sign in succeeds', async () => {
         // Test implementation
       });
       
       it('handles errors correctly', async () => {
         // Test implementation
       });
       
       it('handles cookie-related errors specially', async () => {
         // Test implementation
       });
     });

     // Tests for other functions...
   });
   ```

### Phase 3: Complete AuthContext Tests

1. **Create comprehensive tests for `app/services/auth/AuthContext.tsx`**:
   - Create file: `app/services/auth/__tests__/AuthContext.test.tsx`
   - Test initialization, state management, and error handling
   - Test timeout behavior and auth state changes
   - Test user session management

   ```typescript
   // Example test structure
   import React from 'react';
   import { render, act, waitFor } from '@testing-library/react';
   import { AuthProvider, useAuth } from '../AuthContext';
   import { getSession, onAuthStateChange } from '../supabaseAuth';
   import { createOrUpdateProfile } from '../../profile/profileService';

   jest.mock('../supabaseAuth', () => ({
     getSession: jest.fn(),
     onAuthStateChange: jest.fn(),
   }));

   jest.mock('../../profile/profileService', () => ({
     createOrUpdateProfile: jest.fn(),
   }));

   describe('AuthProvider', () => {
     beforeEach(() => {
       jest.clearAllMocks();
       jest.useFakeTimers();
     });

     afterEach(() => {
       jest.useRealTimers();
     });

     it('initializes with loading state', () => {
       // Test implementation
     });
     
     it('sets user when session exists', async () => {
       // Test implementation
     });
     
     it('handles session errors', async () => {
       // Test implementation
     });
     
     it('handles safety timeout correctly', async () => {
       // Test implementation
     });
     
     it('updates state on auth state changes', async () => {
       // Test implementation
     });
   });
   ```

### Phase 4: Create Component Tests

1. **Create tests for `app/components/ui/auth-dialog.tsx`**:
   - Create file: `app/components/ui/__tests__/auth-dialog.test.tsx`
   - Test rendering in different states (loading, error, authenticated)
   - Test with Suspense boundaries
   - Test user interactions and error handling

2. **Create tests for `app/components/ui/sign-out-button.tsx`**:
   - Create file: `app/components/ui/__tests__/sign-out-button.test.tsx`
   - Test rendering and click behavior
   - Test loading state during sign out
   - Test error handling

### Phase 5: Implement E2E Tests

1. **Create E2E tests for authentication flows**:
   - Create file: `e2e-tests/auth/authentication.spec.ts`
   - Test sign in flow
   - Test sign out flow
   - Test protected route access
   - Test error handling in real browser environment

   ```typescript
   // Example test structure
   import { test, expect } from '@playwright/test';

   test.describe('Authentication', () => {
     test('redirects to sign in when accessing protected content', async ({ page }) => {
       // Test implementation
     });

     test('shows error message for authentication failures', async ({ page }) => {
       // Test implementation
     });

     test('redirects after successful authentication', async ({ page }) => {
       // Test implementation
     });
     
     test('handles sign out correctly', async ({ page }) => {
       // Test implementation
     });
   });
   ```

## Files Requiring Changes

1. **Components Needing Suspense Boundaries**:
   - `app/components/ui/auth-dialog.tsx`
   - `app/components/ui/sign-in.tsx`
   - `app/auth/client.tsx`

2. **Test Files to Create**:
   - `app/services/auth/__tests__/supabaseAuth.test.ts`
   - `app/services/auth/__tests__/AuthContext.test.tsx`
   - `app/components/ui/__tests__/auth-dialog.test.tsx`
   - `app/components/ui/__tests__/sign-out-button.test.tsx`
   - `e2e-tests/auth/authentication.spec.ts`

## Testing Requirements

1. **Unit Tests**:
   - Test components in isolation with mocked dependencies
   - Verify rendering in different states (loading, error, authenticated)
   - Test user interactions and error handling
   - Test with Suspense boundaries

2. **Service Tests**:
   - Test authentication functions with mocked Supabase client
   - Verify error handling, especially for cookie-related errors
   - Test timeout behavior in AuthContext

3. **E2E Tests**:
   - Test complete authentication flows
   - Verify redirects and protected route access
   - Test error handling in real browser environment

## Acceptance Criteria

1. Build process completes successfully without Suspense boundary errors
2. All components using `useSearchParams()` are properly wrapped in Suspense boundaries
3. Unit tests exist for all authentication components with >80% coverage
4. Unit tests exist for all authentication services with >80% coverage
5. E2E tests verify complete authentication flows
6. All tests pass consistently in CI environment

## Additional Context

The existing tests provide a good foundation, particularly:

- `app/__tests__/auth/auth-suspense.test.tsx` demonstrates testing components with Suspense
- `app/__tests__/auth/client-auth-wrapper.test.tsx` shows how to test the auth wrapper
- `app/__tests__/build/suspense-boundaries.test.tsx` and `app/__tests__/components/suspense-boundary.test.tsx` provide patterns for testing Suspense boundaries

We should build on these patterns to ensure comprehensive test coverage of our authentication system.

According to our project documentation in `ai_docs/core/OVERVIEW.md`, we follow a "Testing First" approach with "Complete Test Coverage" for all user journeys. This issue addresses remaining gaps in our testing strategy for authentication.

## Related Documentation

- `ai_docs/core/OVERVIEW.md` - Project philosophy emphasizing testing first
- `ai_docs/core/ARCHITECTURE.md` - Authentication architecture
- `ai_docs/ISSUE_REPORT.md` - Issue reporting guidelines

## Labels
- bug
- enhancement
- testing
- security
