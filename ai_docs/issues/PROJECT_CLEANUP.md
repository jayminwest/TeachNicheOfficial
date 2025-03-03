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

## Detailed Implementation Plan

### Phase 1: Create Centralized Database Service (1-2 days)

#### 1.1 Create Database Service Structure

**Server-Side Database Services**
- [ ] Create `app/api/services/database.ts` with base error handling and retry logic
- [ ] Define consistent error types and response formats
- [ ] Implement connection management and error logging

**Client-Side Database Interfaces**
- [ ] Create `app/services/api-client.ts` for client-side API communication
- [ ] Implement request/response handling with proper typing
- [ ] Add error handling and retry logic for network requests

#### 1.2 Implement Entity-Specific Database Functions

##### Server-Side Modules

**Lessons Module**
- [ ] Create `app/api/services/lessons.ts` with the following functions:
  - [ ] `getLessons(options?: { limit?: number, offset?: number, orderBy?: string }): Promise<Lesson[]>`
  - [ ] `getLessonById(id: string): Promise<Lesson | null>`
  - [ ] `createLesson(data: LessonCreateData): Promise<Lesson>`
  - [ ] `updateLesson(id: string, data: Partial<LessonUpdateData>): Promise<Lesson>`
  - [ ] `deleteLessonById(id: string): Promise<boolean>`
  - [ ] `getLessonWithReviews(id: string): Promise<LessonWithReviews | null>`

**Users/Profiles Module**
- [ ] Create `app/api/services/profiles.ts` with the following functions:
  - [ ] `getProfileById(id: string): Promise<Profile | null>`
  - [ ] `createProfile(data: ProfileCreateData): Promise<Profile>`
  - [ ] `updateProfile(id: string, data: Partial<ProfileUpdateData>): Promise<Profile>`
  - [ ] `getProfileByUserId(userId: string): Promise<Profile | null>`

**Purchases Module**
- [ ] Create `app/api/services/purchases.ts` with the following functions:
  - [ ] `createPurchase(data: PurchaseCreateData): Promise<Purchase>`
  - [ ] `getPurchasesByUserId(userId: string): Promise<Purchase[]>`
  - [ ] `getPurchaseById(id: string): Promise<Purchase | null>`
  - [ ] `checkLessonAccess(userId: string, lessonId: string): Promise<LessonAccess>`

##### Client-Side API Interfaces
- [ ] Create `app/services/lessons-api.ts` with client-side API methods
- [ ] Create `app/services/profiles-api.ts` with client-side API methods
- [ ] Create `app/services/purchases-api.ts` with client-side API methods

#### 1.3 Add Error Handling and Retry Logic

**Server-Side**
- [ ] Implement consistent error handling for database operations
- [ ] Add retry logic for potentially flaky operations
- [ ] Create error classification system for different types of database errors
- [ ] Implement proper logging for server-side errors

**Client-Side**
- [ ] Create standardized API error handling
- [ ] Implement user-friendly error messages
- [ ] Add client-side retry logic for transient failures
- [ ] Create error boundary components for React

#### 1.4 Write Unit Tests

**Server-Side Tests**
- [ ] Create test suite for server-side database services
- [ ] Mock Supabase responses for testing
- [ ] Test error handling and retry logic
- [ ] Test each entity-specific function

**Client-Side Tests**
- [ ] Create test suite for client-side API interfaces
- [ ] Mock API responses for testing
- [ ] Test error handling in client components
- [ ] Test retry logic and loading states

#### 1.5 Update Components (Proof of Concept)
- [ ] Refactor `app/lessons/page.tsx` to use the new client-side API
- [ ] Create corresponding server-side route handlers
- [ ] Refactor `app/lessons/new/page.tsx` to use the new client-side API
- [ ] Verify functionality works as expected

### Phase 2: Authentication Stabilization (1-2 days)

#### 2.1 Create Profile Service

**Server-Side**
- [ ] Create `app/api/services/profile.ts` to handle server-side profile management
- [ ] Implement secure profile creation and validation
- [ ] Add functions for profile updates with proper authorization checks

**Client-Side**
- [ ] Create `app/services/profile-api.ts` for client-side profile operations
- [ ] Move profile creation UI logic from AuthContext to this service
- [ ] Add functions for profile updates and retrieval

#### 2.2 Refactor AuthContext

**Server-Side Auth Handlers**
- [ ] Create `app/api/auth/[...nextauth].ts` for server-side auth handling
- [ ] Implement proper session management
- [ ] Add secure token handling and validation

**Client-Side Auth Context**
- [ ] Simplify state management in `app/services/auth/AuthContext.tsx`
- [ ] Remove nested state updates
- [ ] Use the new profile API service for profile operations
- [ ] Improve error handling consistency

#### 2.3 Simplify OAuth Flows

**Server-Side**
- [ ] Create dedicated OAuth handlers in API routes
- [ ] Implement secure state validation
- [ ] Add proper error handling for OAuth failures

**Client-Side**
- [ ] Refactor `app/services/auth/supabaseAuth.ts` to simplify redirect handling
- [ ] Improve error classification
- [ ] Add better type safety
- [ ] Simplify the auth state change listener

#### 2.4 Update Auth Components
- [ ] Refactor `app/components/ui/auth-dialog.tsx` to separate UI from logic
- [ ] Refactor `app/components/ui/sign-in.tsx` to use the simplified auth service
- [ ] Implement consistent loading and error states
- [ ] Create clear separation between auth UI and auth logic

#### 2.5 Add Authentication Tests

**Server-Side Tests**
- [ ] Create test suite for server-side auth handlers
- [ ] Test session management
- [ ] Test authorization logic
- [ ] Test error handling

**Client-Side Tests**
- [ ] Create test suite for client-side authentication service
- [ ] Test OAuth flows with mocked responses
- [ ] Test error handling scenarios
- [ ] Test auth state changes

### Phase 3: Component Refactoring (2-3 days)

#### 3.1 Create Custom Hooks for Data Fetching

**Client-Side Data Hooks**
- [ ] Create `app/hooks/use-lessons.ts` for lesson data fetching using client API
- [ ] Create `app/hooks/use-profile.ts` for profile data fetching using client API
- [ ] Create `app/hooks/use-purchases.ts` for purchase data fetching using client API
- [ ] Add proper loading, error, and caching states to all hooks

**Server-Side Data Fetching**
- [ ] Create `app/lib/server/get-lessons.ts` for server component data fetching
- [ ] Create `app/lib/server/get-profile.ts` for server component data fetching
- [ ] Create `app/lib/server/get-purchases.ts` for server component data fetching
- [ ] Implement proper error handling for server-side data fetching

#### 3.2 Refactor Lesson Components

**Server Components**
- [ ] Create server components for static lesson data
- [ ] Implement proper data fetching in server components
- [ ] Handle errors gracefully in server components

**Client Components**
- [ ] Update `app/components/ui/lesson-grid.tsx` to use the new client hooks
- [ ] Update `app/components/ui/lesson-card.tsx` to use standardized props
- [ ] Update `app/components/ui/lesson-form.tsx` to improve error handling
- [ ] Clearly separate client-side interactive elements

#### 3.3 Refactor Purchase Components

**Server Components**
- [ ] Create server components for purchase verification
- [ ] Implement secure access checking on the server

**Client Components**
- [ ] Update `app/components/ui/lesson-access-gate.tsx` to use the client API
- [ ] Update `app/components/ui/lesson-preview-dialog.tsx` to use the new hooks
- [ ] Standardize props and interfaces
- [ ] Implement client-side purchase flow with proper error handling

#### 3.4 Implement Consistent Loading and Error States

**Server-Side Error Handling**
- [ ] Create standardized error handling for server components
- [ ] Implement proper error boundaries for server errors

**Client-Side States**
- [ ] Create reusable loading components
- [ ] Create standardized error display components
- [ ] Implement proper Suspense boundaries
- [ ] Update all client components to use these consistent patterns

### Phase 4: Test Optimization (1-2 days)

#### 4.1 Create Test Helpers

**Server-Side Test Helpers**
- [ ] Create `app/__tests__/helpers/server/database-mock.ts` for mocking database
- [ ] Create `app/__tests__/helpers/server/auth-mock.ts` for mocking authentication
- [ ] Create `app/__tests__/helpers/server/api-mock.ts` for mocking API responses

**Client-Side Test Helpers**
- [ ] Create `e2e-tests/helpers/auth.ts` with authentication helpers
- [ ] Create `e2e-tests/helpers/navigation.ts` with navigation helpers
- [ ] Create `e2e-tests/helpers/assertions.ts` with common assertions
- [ ] Create `app/__tests__/helpers/client/hooks-mock.ts` for testing hooks

#### 4.2 Refactor Core E2E Tests
- [ ] Refactor `e2e-tests/lesson-purchase.spec.ts` to use the new helpers
- [ ] Reduce reliance on specific test IDs
- [ ] Focus on critical user flows
- [ ] Separate server-dependent and client-only tests

#### 4.3 Remove Redundant Tests
- [ ] Identify and remove redundant authentication tests
- [ ] Replace complex UI tests with simpler functional tests
- [ ] Document which tests were removed and why
- [ ] Separate client-side and server-side test concerns

#### 4.4 Add Missing Unit Tests

**Server-Side Tests**
- [ ] Add tests for server API routes
- [ ] Add tests for server-side database services
- [ ] Add tests for server-side authentication
- [ ] Test server-side error handling

**Client-Side Tests**
- [ ] Add tests for client API interfaces
- [ ] Add tests for client-side authentication service
- [ ] Add tests for custom hooks
- [ ] Test client-side error handling and loading states

## Testing Strategy

### E2E Tests to Keep
1. **Core User Journey Tests**:
   - User registration and login flow
   - Lesson browsing and viewing
   - Lesson purchase flow
   - Instructor lesson creation

2. **Critical Business Logic Tests**:
   - Payment processing verification
   - Access control for purchased content
   - Instructor payout verification

### E2E Tests to Remove or Simplify
1. **Redundant Authentication Tests**:
   - Multiple variations of login/signup that test the same paths
   - Tests that verify UI details rather than functionality

2. **Non-Critical Feature Tests**:
   - Profile customization tests (can be unit tested instead)
   - Comment/rating tests (can be unit tested instead)
   - Admin-only features that aren't core to the user experience

3. **Overly Complex Tests**:
   - Tests with excessive mocking that are difficult to maintain
   - Tests that depend on specific UI implementation details

### Server-Side Unit Tests to Add
1. **API Route Tests**:
   - Test all API endpoints
   - Verify proper authorization checks
   - Test error handling and status codes
   - Verify data validation

2. **Server Database Service Tests**:
   - Test CRUD operations for each entity
   - Verify error handling and retry logic
   - Test transaction handling
   - Test data integrity constraints

3. **Server Authentication Tests**:
   - Test authentication middleware
   - Verify session handling
   - Test authorization logic
   - Test token validation and refresh

### Client-Side Unit Tests to Add
1. **Client API Interface Tests**:
   - Test API client methods
   - Verify error handling
   - Test retry logic
   - Test response parsing

2. **Authentication Service Tests**:
   - Test all authentication methods
   - Verify error handling
   - Test token refresh logic
   - Test auth state management

3. **Component Logic Tests**:
   - Test form validation
   - Test state management
   - Test conditional rendering logic
   - Test loading and error states

## Weekly Review Checkpoints

### Week 1 Review
- [ ] Database service implementation complete
- [ ] Initial authentication refactoring complete
- [ ] At least 2-3 components updated to use new services
- [ ] Unit tests for database service passing

### Week 2 Review
- [ ] Component refactoring complete
- [ ] Custom hooks implemented and tested
- [ ] Authentication flow fully refactored
- [ ] E2E test helpers created

### Week 3 Review
- [ ] All E2E tests refactored or removed as planned
- [ ] All components using consistent patterns
- [ ] Full test coverage for critical paths
- [ ] Documentation updated to reflect new architecture

## Completion Criteria
- All tracked items in the progress tracking section are complete
- Authentication flows work consistently across all paths
- Database operations are centralized through the database service
- E2E tests cover all critical user journeys without redundancy
- Unit tests provide adequate coverage for core services
- All components use consistent patterns for data fetching and error handling

## Additional Context
This cleanup is critical for project stability and should be approached with a focus on simplicity and reliability rather than adding new features. The goal is to have a stable, working product with the existing feature set properly implemented and tested.
