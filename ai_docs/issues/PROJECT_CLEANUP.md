# Project Cleanup and Stabilization

## Description
The project requires significant cleanup and stabilization to ensure all core features are working properly. Currently, there are issues with authentication, excessive e2e tests, and database communication. We need to trim unnecessary components and focus on getting the existing features into a working, tested condition using the simplest approach possible.

## Technical Analysis
Based on the codebase review, several areas need immediate attention:

1. **Authentication System**:
   - The current auth implementation in `AuthContext.tsx` is overly complex with multiple nested state updates
   - `signInWithGoogle()` in `supabaseAuth.ts` has complex redirect handling that could be simplified
   - Error handling is inconsistent across authentication flows
   - Profile creation logic is embedded in the auth context rather than separated as a service

2. **Database Communication**:
   - Direct Supabase client calls scattered throughout components (e.g., in `lessons/page.tsx`)
   - No abstraction layer for common database operations
   - Inconsistent error handling for database operations
   - Missing retry logic for potentially flaky operations

3. **Testing Infrastructure**:
   - E2E tests like `lesson-purchase.spec.ts` contain complex mocking that's difficult to maintain
   - Login flow in e2e tests is brittle and could fail with minor UI changes
   - Tests rely on specific test IDs that must be maintained across UI changes

4. **Component Structure**:
   - Components like `sign-in.tsx` mix authentication logic with UI rendering
   - Lesson-related components have duplicated code for fetching and displaying lessons
   - Inconsistent prop interfaces across similar components

## Files Requiring Updates

### Authentication
- `app/services/auth/AuthContext.tsx`:
  - Simplify state management
  - Extract profile creation to a separate service
  - Improve error handling consistency

- `app/services/auth/supabaseAuth.ts`:
  - Simplify OAuth redirect handling
  - Add better error classification
  - Improve type safety

- `app/components/ui/auth-dialog.tsx` and `app/components/ui/sign-in.tsx`:
  - Separate UI from authentication logic
  - Implement consistent loading and error states

### Database Access
- Create a new `app/services/database.ts` service with:
  - Typed wrapper functions for common operations
  - Consistent error handling
  - Optional retry logic for flaky operations

- Update components to use this service:
  - `app/lessons/page.tsx`
  - `app/lessons/new/page.tsx`
  - Other components that directly access Supabase

### Testing
- Simplify `e2e-tests/lesson-purchase.spec.ts`:
  - Create reusable authentication helpers
  - Reduce reliance on specific test IDs
  - Focus on critical user flows only

- Add unit tests for core services:
  - Authentication service
  - Database service
  - Lesson management

### Component Cleanup
- Refactor lesson-related components:
  - Extract data fetching to custom hooks or services
  - Standardize props and interfaces
  - Improve error handling and loading states

## Implementation Plan

1. **Phase 1: Create Centralized Database Service (1-2 days)**
   - Implement `app/services/database.ts` with typed helper functions
   - Add consistent error handling and logging
   - Create specialized functions for common operations (lessons, profiles, etc.)

2. **Phase 2: Authentication Stabilization (1-2 days)**
   - Refactor `AuthContext.tsx` to simplify state management
   - Extract profile management to a separate service
   - Improve error handling and user feedback

3. **Phase 3: Component Refactoring (2-3 days)**
   - Update components to use the new database service
   - Separate UI from data fetching logic
   - Standardize props and interfaces

4. **Phase 4: Test Optimization (1-2 days)**
   - Simplify e2e tests to focus on critical paths
   - Create reusable test helpers
   - Add unit tests for core services

## Testing Requirements
- Verify authentication works consistently across all flows
- Ensure database operations function correctly with the new service
- Validate that remaining e2e tests cover critical user journeys
- Confirm all lesson-related features work as expected

## Additional Context
This cleanup is critical for project stability and should be approached with a focus on simplicity and reliability rather than adding new features. The goal is to have a stable, working product with the existing feature set properly implemented and tested.
