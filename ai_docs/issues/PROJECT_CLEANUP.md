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
- [ ] Create `app/services/database.ts` with base error handling and retry logic
- [ ] Define consistent error types and response formats
- [ ] Implement connection management and error logging

#### 1.2 Implement Entity-Specific Database Functions

##### Lessons Module
- [ ] Create `app/services/database/lessons.ts` with the following functions:
  - [ ] `getLessons(options?: { limit?: number, offset?: number, orderBy?: string }): Promise<Lesson[]>`
  - [ ] `getLessonById(id: string): Promise<Lesson | null>`
  - [ ] `createLesson(data: LessonCreateData): Promise<Lesson>`
  - [ ] `updateLesson(id: string, data: Partial<LessonUpdateData>): Promise<Lesson>`
  - [ ] `deleteLessonById(id: string): Promise<boolean>`
  - [ ] `getLessonWithReviews(id: string): Promise<LessonWithReviews | null>`

##### Users/Profiles Module
- [ ] Create `app/services/database/profiles.ts` with the following functions:
  - [ ] `getProfileById(id: string): Promise<Profile | null>`
  - [ ] `createProfile(data: ProfileCreateData): Promise<Profile>`
  - [ ] `updateProfile(id: string, data: Partial<ProfileUpdateData>): Promise<Profile>`
  - [ ] `getProfileByUserId(userId: string): Promise<Profile | null>`

##### Purchases Module
- [ ] Create `app/services/database/purchases.ts` with the following functions:
  - [ ] `createPurchase(data: PurchaseCreateData): Promise<Purchase>`
  - [ ] `getPurchasesByUserId(userId: string): Promise<Purchase[]>`
  - [ ] `getPurchaseById(id: string): Promise<Purchase | null>`
  - [ ] `checkLessonAccess(userId: string, lessonId: string): Promise<LessonAccess>`

#### 1.3 Add Error Handling and Retry Logic
- [ ] Implement consistent error handling for database operations
- [ ] Add retry logic for potentially flaky operations
- [ ] Create error classification system for different types of database errors

#### 1.4 Write Unit Tests
- [ ] Create test suite for database service
- [ ] Mock Supabase responses for testing
- [ ] Test error handling and retry logic
- [ ] Test each entity-specific function

#### 1.5 Update Components (Proof of Concept)
- [ ] Refactor `app/lessons/page.tsx` to use the new database service
- [ ] Refactor `app/lessons/new/page.tsx` to use the new database service
- [ ] Verify functionality works as expected

### Phase 2: Authentication Stabilization (1-2 days)

#### 2.1 Create Profile Service
- [ ] Create `app/services/profile.ts` to handle profile management
- [ ] Move profile creation logic from AuthContext to this service
- [ ] Add functions for profile updates and retrieval

#### 2.2 Refactor AuthContext
- [ ] Simplify state management in `app/services/auth/AuthContext.tsx`
- [ ] Remove nested state updates
- [ ] Use the new profile service for profile operations
- [ ] Improve error handling consistency

#### 2.3 Simplify OAuth Flows
- [ ] Refactor `app/services/auth/supabaseAuth.ts` to simplify redirect handling
- [ ] Improve error classification
- [ ] Add better type safety
- [ ] Simplify the auth state change listener

#### 2.4 Update Auth Components
- [ ] Refactor `app/components/ui/auth-dialog.tsx` to separate UI from logic
- [ ] Refactor `app/components/ui/sign-in.tsx` to use the simplified auth service
- [ ] Implement consistent loading and error states

#### 2.5 Add Authentication Tests
- [ ] Create test suite for authentication service
- [ ] Test OAuth flows with mocked responses
- [ ] Test error handling scenarios
- [ ] Test auth state changes

### Phase 3: Component Refactoring (2-3 days)

#### 3.1 Create Custom Hooks for Data Fetching
- [ ] Create `app/hooks/use-lessons.ts` for lesson data fetching
- [ ] Create `app/hooks/use-profile.ts` for profile data fetching
- [ ] Create `app/hooks/use-purchases.ts` for purchase data fetching

#### 3.2 Refactor Lesson Components
- [ ] Update `app/components/ui/lesson-grid.tsx` to use the new hooks
- [ ] Update `app/components/ui/lesson-card.tsx` to use standardized props
- [ ] Update `app/components/ui/lesson-form.tsx` to improve error handling

#### 3.3 Refactor Purchase Components
- [ ] Update `app/components/ui/lesson-access-gate.tsx` to use the database service
- [ ] Update `app/components/ui/lesson-preview-dialog.tsx` to use the new hooks
- [ ] Standardize props and interfaces

#### 3.4 Implement Consistent Loading and Error States
- [ ] Create reusable loading components
- [ ] Create standardized error display components
- [ ] Update all components to use these consistent patterns

### Phase 4: Test Optimization (1-2 days)

#### 4.1 Create Test Helpers
- [ ] Create `e2e-tests/helpers/auth.ts` with authentication helpers
- [ ] Create `e2e-tests/helpers/navigation.ts` with navigation helpers
- [ ] Create `e2e-tests/helpers/assertions.ts` with common assertions

#### 4.2 Refactor Core E2E Tests
- [ ] Refactor `e2e-tests/lesson-purchase.spec.ts` to use the new helpers
- [ ] Reduce reliance on specific test IDs
- [ ] Focus on critical user flows

#### 4.3 Remove Redundant Tests
- [ ] Identify and remove redundant authentication tests
- [ ] Replace complex UI tests with simpler functional tests
- [ ] Document which tests were removed and why

#### 4.4 Add Missing Unit Tests
- [ ] Add tests for database service
- [ ] Add tests for authentication service
- [ ] Add tests for custom hooks

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

### Unit Tests to Add
1. **Authentication Service**:
   - Test all authentication methods
   - Verify error handling
   - Test token refresh logic

2. **Database Service**:
   - Test CRUD operations for each entity
   - Verify error handling and retry logic
   - Test transaction handling

3. **Component Logic**:
   - Test form validation
   - Test state management
   - Test conditional rendering logic

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
