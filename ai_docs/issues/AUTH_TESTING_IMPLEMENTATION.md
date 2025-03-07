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

### Phase 1: Fix Suspense Boundary Issues ✅

1. **Update `app/components/ui/auth-dialog.tsx`**: ✅
   - Refactored to extract the component that uses `useSearchParams` into `AuthDialogContent`
   - Wrapped `AuthDialogContent` in a Suspense boundary with appropriate fallback UI
   - Implemented proper error handling and loading states

2. **Update `app/components/ui/sign-in.tsx`**: ✅
   - Extracted the component that uses `useSearchParams` into `SignInPageContent`
   - Wrapped `SignInPageContent` in a Suspense boundary with appropriate fallback UI
   - Added comprehensive tests in `app/components/ui/__tests__/sign-in.test.tsx`

3. **Update `app/auth/client.tsx`**: ✅
   - Extracted the component that uses `useSearchParams` into `AuthClientContent`
   - Wrapped `AuthClientContent` in a Suspense boundary with appropriate fallback UI
   - Ensured proper error handling and loading states

4. **Update `app/auth/client-auth-wrapper.tsx`**: ✅
   - Ensured proper Suspense boundary implementation
   - Added comprehensive tests in `app/__tests__/auth/client-auth-wrapper.test.tsx`

All components using `useSearchParams()` are now properly wrapped in Suspense boundaries, which should resolve the build errors related to missing Suspense boundaries.

### Phase 2: Complete Authentication Service Tests ✅

1. **Create comprehensive tests for `app/services/auth/supabaseAuth.ts`**: ✅
   - Created file: `app/services/auth/__tests__/supabaseAuth.test.ts`
   - Tested all exported functions: `signInWithGoogle`, `signOut`, `getSession`, `onAuthStateChange`
   - Tested error handling, including cookie-related errors
   - Tested edge cases and error scenarios
   - Fixed issue with function reference comparison in `onAuthStateChange` test

   The implementation follows the example structure and includes tests for all exported functions with proper mocking of the Supabase client. All tests are now passing, including the previously failing test for `onAuthStateChange`.

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

1. **Components Needing Suspense Boundaries**: ✅
   - `app/components/ui/auth-dialog.tsx` ✅
   - `app/components/ui/sign-in.tsx` ✅
   - `app/auth/client.tsx` ✅

2. **Test Files to Create**:
   - `app/services/auth/__tests__/supabaseAuth.test.ts` ✅
   - `app/services/auth/__tests__/AuthContext.test.tsx` 🔄
   - `app/components/ui/__tests__/auth-dialog.test.tsx` 🔄
   - `app/components/ui/__tests__/sign-out-button.test.tsx` 🔄
   - `e2e-tests/auth/authentication.spec.ts` 🔄

Legend:
- ✅ Completed
- 🔄 In progress

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

1. Build process completes successfully without Suspense boundary errors ✅
2. All components using `useSearchParams()` are properly wrapped in Suspense boundaries ✅
3. Unit tests exist for all authentication components with >80% coverage 🔄
4. Unit tests exist for all authentication services with >80% coverage ✅ (for supabaseAuth.ts)
5. E2E tests verify complete authentication flows 🔄
6. All tests pass consistently in CI environment 🔄

Progress:
- ✅ Fixed Suspense boundary issues in all components using `useSearchParams()`
- ✅ Implemented proper error handling and loading states
- ✅ Added tests for `sign-in.tsx` component
- ✅ Completed tests for `supabaseAuth.ts` service
- 🔄 Working on remaining tests for authentication services and components

## Additional Context

The existing tests provide a good foundation, particularly:

- `app/__tests__/auth/auth-suspense.test.tsx` demonstrates testing components with Suspense
- `app/__tests__/auth/client-auth-wrapper.test.tsx` shows how to test the auth wrapper
- `app/__tests__/build/suspense-boundaries.test.tsx` and `app/__tests__/components/suspense-boundary.test.tsx` provide patterns for testing Suspense boundaries

We have successfully built on these patterns to implement proper Suspense boundaries for all components using `useSearchParams()`. This should resolve the build errors related to missing Suspense boundaries.

Next steps:
1. Complete the remaining test files for authentication services and components
2. Implement E2E tests for authentication flows
3. Ensure all tests pass consistently in CI environment

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
