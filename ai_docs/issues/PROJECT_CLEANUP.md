# Project Cleanup and Stabilization

## Description
The project requires significant cleanup and stabilization to ensure all core features are working properly. Currently, there are issues with authentication, excessive e2e tests, and database communication. We need to trim unnecessary components and focus on getting the existing features into a working, tested condition using the simplest approach possible.

## Progress Summary
- ✅ Created centralized database service with error handling and retry logic
- ✅ Implemented entity-specific services for lessons and purchases
- ✅ Simplified authentication context and extracted profile management
- ✅ Created custom hooks for data fetching
- ✅ Refactored key components to use new services
- ✅ Added authentication test helpers for E2E tests
- 🔄 In progress: Updating remaining components
- 🔄 In progress: Optimizing test suite

## Technical Analysis
Based on the codebase review, several areas need immediate attention:

1. **Authentication System**:
   - ✅ The current auth implementation in `AuthContext.tsx` is overly complex with multiple nested state updates
   - ✅ `signInWithGoogle()` in `supabaseAuth.ts` has complex redirect handling that could be simplified
   - ✅ Error handling is inconsistent across authentication flows
   - ✅ Profile creation logic is embedded in the auth context rather than separated as a service

2. **Database Communication**:
   - ✅ Direct Supabase client calls scattered throughout components (e.g., in `lessons/page.tsx`)
   - ✅ No abstraction layer for common database operations
   - ✅ Inconsistent error handling for database operations
   - ✅ Missing retry logic for potentially flaky operations

3. **Testing Infrastructure**:
   - ✅ E2E tests like `lesson-purchase.spec.ts` contain complex mocking that's difficult to maintain
   - ✅ Login flow in e2e tests is brittle and could fail with minor UI changes
   - 🔄 Tests rely on specific test IDs that must be maintained across UI changes

4. **Component Structure**:
   - ✅ Components like `sign-in.tsx` mix authentication logic with UI rendering
   - 🔄 Lesson-related components have duplicated code for fetching and displaying lessons
   - 🔄 Inconsistent prop interfaces across similar components

## Files Requiring Updates

### Authentication
- ✅ `app/services/auth/AuthContext.tsx`:
  - ✅ Simplify state management
  - ✅ Extract profile creation to a separate service
  - ✅ Improve error handling consistency

- ✅ `app/services/auth/supabaseAuth.ts`:
  - ✅ Simplify OAuth redirect handling
  - ✅ Add better error classification
  - ✅ Improve type safety

- ✅ `app/components/ui/auth-dialog.tsx` and `app/components/ui/sign-in.tsx`:
  - ✅ Separate UI from authentication logic
  - ✅ Implement consistent loading and error states

### Database Access
- ✅ Create a new `app/services/database.ts` service with:
  - ✅ Typed wrapper functions for common operations
  - ✅ Consistent error handling
  - ✅ Optional retry logic for flaky operations

- ✅ Update components to use this service:
  - ✅ `app/lessons/page.tsx`
  - 🔄 `app/lessons/new/page.tsx`
  - 🔄 Other components that directly access Supabase

### Testing
- ✅ Simplify `e2e-tests/lesson-purchase.spec.ts`:
  - ✅ Create reusable authentication helpers
  - ✅ Reduce reliance on specific test IDs
  - ✅ Focus on critical user flows only

- 🔄 Add unit tests for core services:
  - 🔄 Authentication service
  - 🔄 Database service
  - 🔄 Lesson management

### Component Cleanup
- 🔄 Refactor lesson-related components:
  - ✅ Extract data fetching to custom hooks or services
  - 🔄 Standardize props and interfaces
  - 🔄 Improve error handling and loading states

## Detailed Implementation Plan

### Phase 1: Create Centralized Database Service (1-2 days) ✅

#### 1.1 Create Database Service Structure ✅

**Server-Side Database Services**
- [x] Create `app/services/database/databaseService.ts` with base error handling and retry logic
- [x] Define consistent error types and response formats
- [x] Implement connection management and error logging

**Client-Side Database Interfaces**
- [x] Create database service classes for client-side data access
- [x] Implement request/response handling with proper typing
- [x] Add error handling and retry logic for database operations

#### 1.2 Implement Entity-Specific Database Functions ✅

##### Database Service Modules

**Lessons Module**
- [x] Create `app/services/database/lessonsService.ts` with the following functions:
  - [x] `getLessons(options?: { limit?: number, offset?: number, orderBy?: string }): Promise<DatabaseResponse<Lesson[]>>`
  - [x] `getLessonById(id: string): Promise<DatabaseResponse<Lesson>>`
  - [x] `createLesson(data: LessonCreateData): Promise<DatabaseResponse<Lesson>>`
  - [x] `updateLesson(id: string, data: Partial<LessonUpdateData>): Promise<DatabaseResponse<Lesson>>`

**Profiles Module**
- [x] Create `app/services/profile/profileService.ts` with the following functions:
  - [x] `createOrUpdateProfile(user: User): Promise<boolean>`
  - [x] `getProfileById(userId: string): Promise<{ data: Profile | null, error: Error | null }>`
  - [x] `updateProfile(userId: string, profileData: ProfileUpdateData): Promise<{ data: Profile | null, error: Error | null }>`

**Purchases Module**
- [x] Create `app/services/database/purchasesService.ts` with the following functions:
  - [x] `createPurchase(data: PurchaseCreateData): Promise<DatabaseResponse<{ id: string }>>`
  - [x] `getPurchasesByUserId(userId: string): Promise<DatabaseResponse<Purchase[]>>`
  - [x] `updatePurchaseStatus(stripeSessionId: string, status: PurchaseStatus): Promise<DatabaseResponse<{ id: string }>>`
  - [x] `checkLessonAccess(userId: string, lessonId: string): Promise<DatabaseResponse<LessonAccess>>`

##### Client-Side Hooks
- [x] Create `app/hooks/use-lessons.ts` with client-side data fetching hooks
- [x] Create `app/hooks/use-lesson-access.ts` with access checking hooks

#### 1.3 Add Error Handling and Retry Logic ✅

**Database Services**
- [x] Implement consistent error handling for database operations
- [x] Add retry logic for potentially flaky operations
- [x] Create error classification system for different types of database errors
- [x] Implement proper logging for database errors

**Client-Side**
- [x] Create standardized database response handling
- [x] Implement user-friendly error messages
- [x] Add retry logic for transient failures
- [x] Handle loading and error states in components

#### 1.4 Write Unit Tests 🔄

**Database Service Tests**
- [ ] Create test suite for database services
- [ ] Mock Supabase responses for testing
- [ ] Test error handling and retry logic
- [ ] Test each entity-specific function

**Client-Side Tests**
- [ ] Create test suite for client-side hooks
- [ ] Mock database service responses for testing
- [ ] Test error handling in client components
- [ ] Test retry logic and loading states

#### 1.5 Update Components (Proof of Concept) ✅
- [x] Refactor `app/lessons/page.tsx` to use the new hooks
- [x] Refactor `app/components/ui/lesson-access-gate.tsx` to use the new hooks
- [ ] Refactor `app/lessons/new/page.tsx` to use the new services
- [x] Verify functionality works as expected

### Phase 2: Authentication Stabilization (1-2 days) ✅

#### 2.1 Create Profile Service ✅

**Client-Side**
- [x] Create `app/services/profile/profileService.ts` for profile management
- [x] Implement secure profile creation and validation
- [x] Add functions for profile updates with proper authorization checks
- [x] Extract profile creation logic from AuthContext

#### 2.2 Refactor AuthContext ✅

**Client-Side Auth Context**
- [x] Simplify state management in `app/services/auth/AuthContext.tsx`
- [x] Remove nested state updates
- [x] Use the new profile service for profile operations
- [x] Improve error handling consistency

#### 2.3 Simplify OAuth Flows ✅

**Client-Side**
- [x] Refactor `app/services/auth/supabaseAuth.ts` to simplify redirect handling
- [x] Improve error classification
- [x] Add better type safety
- [x] Simplify the auth state change listener

#### 2.4 Update Auth Components ✅
- [x] Refactor `app/components/ui/sign-in.tsx` to use the simplified auth service
- [x] Implement consistent loading and error states
- [x] Create clear separation between auth UI and auth logic

#### 2.5 Add Authentication Tests 🔄

**Client-Side Tests**
- [ ] Create test suite for client-side authentication service
- [ ] Test OAuth flows with mocked responses
- [ ] Test error handling scenarios
- [ ] Test auth state changes

### Phase 3: Component Refactoring (2-3 days) 🔄

#### 3.1 Create Custom Hooks for Data Fetching ✅

**Client-Side Data Hooks**
- [x] Create `app/hooks/use-lessons.ts` for lesson data fetching
- [x] Create `app/hooks/use-lesson-access.ts` for access checking
- [ ] Create `app/hooks/use-profile.ts` for profile data fetching
- [ ] Create `app/hooks/use-purchases.ts` for purchase data fetching
- [x] Add proper loading, error, and state management to hooks

**Server-Side Data Fetching**
- [ ] Create server-side data fetching utilities as needed
- [ ] Implement proper error handling for server-side data fetching

#### 3.2 Refactor Lesson Components 🔄

**Client Components**
- [x] Update `app/lessons/page.tsx` to use the new hooks
- [ ] Update `app/components/ui/lesson-grid.tsx` to use standardized props
- [ ] Update `app/components/ui/lesson-card.tsx` to use standardized props
- [ ] Update `app/components/ui/lesson-form.tsx` to improve error handling
- [ ] Clearly separate client-side interactive elements

#### 3.3 Refactor Purchase Components 🔄

**Client Components**
- [x] Update `app/components/ui/lesson-access-gate.tsx` to use the new hooks
- [ ] Update `app/components/ui/lesson-preview-dialog.tsx` to use the new hooks
- [ ] Standardize props and interfaces
- [ ] Implement client-side purchase flow with proper error handling

#### 3.4 Implement Consistent Loading and Error States 🔄

**Client-Side States**
- [x] Implement consistent loading states in refactored components
- [x] Implement consistent error handling in refactored components
- [ ] Update remaining components to use these consistent patterns

### Phase 4: Test Optimization (1-2 days) 🔄

#### 4.1 Create Test Helpers ✅

**Client-Side Test Helpers**
- [x] Create `e2e-tests/helpers/auth.ts` with authentication helpers
- [ ] Create `e2e-tests/helpers/navigation.ts` with navigation helpers
- [ ] Create `e2e-tests/helpers/assertions.ts` with common assertions
- [ ] Create test helpers for mocking hooks and services

#### 4.2 Refactor Core E2E Tests ✅
- [x] Refactor `e2e-tests/lesson-purchase.spec.ts` to use the new helpers
- [x] Reduce reliance on specific test IDs
- [x] Focus on critical user flows
- [ ] Separate server-dependent and client-only tests

#### 4.3 Remove Redundant Tests 🔄
- [ ] Identify and remove redundant authentication tests
- [ ] Replace complex UI tests with simpler functional tests
- [ ] Document which tests were removed and why
- [ ] Separate client-side and server-side test concerns

#### 4.4 Add Missing Unit Tests 🔄

**Service Tests**
- [ ] Add tests for database services
- [ ] Add tests for authentication services
- [ ] Test error handling and retry logic

**Client-Side Tests**
- [ ] Add tests for custom hooks
- [ ] Add tests for client-side authentication
- [ ] Test client-side error handling and loading states

## Testing Strategy

### E2E Tests to Keep ✅
1. **Core User Journey Tests**:
   - User registration and login flow
   - Lesson browsing and viewing
   - Lesson purchase flow
   - Instructor lesson creation

2. **Critical Business Logic Tests**:
   - Payment processing verification
   - Access control for purchased content
   - Instructor payout verification

### E2E Tests to Remove or Simplify 🔄
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

### Service Unit Tests to Add 🔄
1. **Database Service Tests**:
   - Test CRUD operations for each entity
   - Verify error handling and retry logic
   - Test data integrity constraints

2. **Authentication Service Tests**:
   - Test authentication methods
   - Verify error handling
   - Test auth state management

### Client-Side Unit Tests to Add 🔄
1. **Custom Hooks Tests**:
   - Test data fetching hooks
   - Verify error handling
   - Test loading states
   - Test data transformations

2. **Component Logic Tests**:
   - Test form validation
   - Test state management
   - Test conditional rendering logic
   - Test loading and error states

## Weekly Review Checkpoints

### Week 1 Review ✅
- [x] Database service implementation complete
- [x] Initial authentication refactoring complete
- [x] At least 2-3 components updated to use new services
- [ ] Unit tests for database service passing

### Week 2 Review 🔄
- [ ] Component refactoring complete
- [x] Custom hooks implemented
- [x] Authentication flow fully refactored
- [x] E2E test helpers created

### Week 3 Review 🔄
- [ ] All E2E tests refactored or removed as planned
- [ ] All components using consistent patterns
- [ ] Full test coverage for critical paths
- [x] Documentation updated to reflect new architecture

## Completion Criteria
- All tracked items in the progress tracking section are complete
- Authentication flows work consistently across all paths
- Database operations are centralized through the database service
- E2E tests cover all critical user journeys without redundancy
- Unit tests provide adequate coverage for core services
- All components use consistent patterns for data fetching and error handling

## Next Steps
1. Complete the refactoring of remaining lesson components
2. Implement unit tests for database services and hooks
3. Refactor purchase-related components
4. Optimize and clean up the test suite
5. Document the new architecture and patterns

## Additional Context
This cleanup is critical for project stability and should be approached with a focus on simplicity and reliability rather than adding new features. The goal is to have a stable, working product with the existing feature set properly implemented and tested.
