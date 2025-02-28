# Firebase Authentication Testing Strategy

## Issue Description

Our Firebase authentication implementation has undergone significant refactoring to support server-side rendering (SSR) and dynamic imports. We need a comprehensive testing strategy to ensure the authentication flow works correctly across all environments.

## Current Implementation

The current implementation uses:
- Dynamic imports for Firebase auth modules to prevent SSR issues
- Lazy initialization of auth services
- Server-safe fallbacks for auth operations
- Multiple abstraction layers (firebase.ts, firebase-auth.ts, firebase-auth-service.ts)

## Testing Requirements

We need to implement tests at multiple levels:

### Unit Tests

1. **Auth Service Tests**
   - Test individual methods in isolation
   - Mock Firebase dependencies
   - Verify correct behavior for success and error cases

2. **Auth Context Tests**
   - Test provider initialization
   - Test context hooks and state management
   - Verify correct rendering based on auth state

### Integration Tests

1. **Auth Flow Tests**
   - Test sign-in, sign-up, and sign-out flows
   - Test password reset flow
   - Test profile updates

2. **Component Integration Tests**
   - Test components that depend on auth state
   - Verify UI updates correctly based on auth changes

### End-to-End Tests

1. **Full Authentication Flow**
   - Test complete user journeys
   - Use real Firebase services in test environment
   - Verify persistence and session management

2. **Error Handling**
   - Test error scenarios (network issues, invalid credentials)
   - Verify error messages and recovery paths

## Implementation Plan

### 1. Unit Test Setup

```typescript
// Example test for firebase-auth-service.ts
import { FirebaseAuthService } from '@/app/services/auth/firebase-auth-service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn()
}));

describe('FirebaseAuthService', () => {
  let authService: FirebaseAuthService;
  
  beforeEach(() => {
    authService = new FirebaseAuthService();
    vi.clearAllMocks();
  });
  
  it('should sign in a user successfully', async () => {
    // Arrange
    const mockUser = { uid: '123', email: 'test@example.com' };
    const mockCredential = { user: mockUser };
    const signInMock = vi.mocked(signInWithEmailAndPassword);
    signInMock.mockResolvedValue(mockCredential as any);
    
    // Act
    const result = await authService.signIn('test@example.com', 'password');
    
    // Assert
    expect(signInMock).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password');
    expect(result.id).toBe('123');
    expect(result.email).toBe('test@example.com');
  });
  
  // Additional tests for other methods
});
```

### 2. Auth Context Tests

```typescript
// Example test for AuthContext.tsx
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/app/services/auth/AuthContext';
import { vi, describe, it, expect } from 'vitest';

// Mock Firebase auth
vi.mock('@/app/lib/firebase', () => ({
  app: {},
  getAuth: vi.fn(() => null)
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simulate auth state change
    callback(null);
    return vi.fn(); // Return unsubscribe function
  })
}));

const TestComponent = () => {
  const { user, loading } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  it('should provide auth state to components', async () => {
    // Arrange & Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Assert - initially loading
    expect(screen.getByTestId('loading').textContent).toBe('Loading');
    
    // Wait for auth state to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Assert - finished loading, no user
    expect(screen.getByTestId('loading').textContent).toBe('Not Loading');
    expect(screen.getByTestId('user').textContent).toBe('No User');
  });
  
  // Additional tests for authenticated state, etc.
});
```

### 3. Integration Tests

```typescript
// Example integration test for sign-in flow
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignInForm } from '@/app/components/ui/sign-in';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import authService from '@/app/services/auth/auth-provider';

// Mock auth service
vi.mock('@/app/services/auth/auth-provider', () => ({
  default: {
    signIn: vi.fn()
  }
}));

describe('SignInForm Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should call auth service when form is submitted', async () => {
    // Arrange
    const mockSignIn = vi.mocked(authService.signIn);
    mockSignIn.mockResolvedValue({ id: '123', email: 'test@example.com' } as any);
    
    render(<SignInForm onSuccess={vi.fn()} />);
    
    // Act
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Assert
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
  
  // Additional tests for error handling, loading states, etc.
});
```

### 4. End-to-End Tests with Playwright

```typescript
// Example E2E test for authentication flow
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to sign in', async ({ page }) => {
    // Navigate to the site
    await page.goto('/');
    
    // Click sign in button
    await page.click('[data-testid="sign-in-button"]');
    
    // Fill in credentials - use test account
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify user is signed in
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Verify navigation to dashboard or profile
    await expect(page).toHaveURL(/\/profile|\/dashboard/);
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to the site
    await page.goto('/');
    
    // Click sign in button
    await page.click('[data-testid="sign-in-button"]');
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(/invalid/i);
  });
  
  // Additional tests for sign up, sign out, etc.
});
```

### 5. Firebase Emulator Integration

For tests that need to interact with Firebase services without using production resources:

```typescript
// Example setup for Firebase emulator integration
import { test, expect } from '@playwright/test';

// Configure the test to use Firebase emulators
test.beforeAll(async () => {
  // Set environment variables for emulator use
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
});

test('should authenticate with emulator', async ({ page }) => {
  // Set environment variable to use emulators in the browser context
  await page.addInitScript(() => {
    window.FIREBASE_USE_EMULATORS = true;
  });
  
  // Navigate to the site
  await page.goto('/');
  
  // Perform authentication flow
  // ...
  
  // Verify authentication worked
  // ...
});
```

## Testing Tools

1. **Vitest**: For unit and integration tests
2. **React Testing Library**: For component testing
3. **Playwright**: For end-to-end tests
4. **Firebase Emulators**: For testing against Firebase services
5. **MSW (Mock Service Worker)**: For mocking API requests

## Implementation Progress

We've made significant progress implementing the testing strategy for Firebase authentication. Here's a summary of what we've accomplished and the current status:

### Unit Tests: Firebase Auth Service
**File:** `app/services/auth/__tests__/firebase-auth-service.test.ts`
- ✅ Successfully converted tests from Vitest to Jest
- ✅ All tests now passing:
  1. Sign in with email/password
  2. Handle sign-in errors
  3. Sign up new users
  4. Sign out users

**Resolved Issues:**
- Fixed mock user objects to include required metadata structure
- Aligned error messages between tests and implementation
- Improved test assertions to be more resilient

### Unit Tests: Auth Context
**File:** `app/services/auth/__tests__/auth-context.test.tsx`
- ✅ All tests passing successfully
  1. Provide initial auth state to components
  2. Update when user signs in
  3. Update when user signs out

**Implementation Details:**
- Successfully mocked Firebase auth state changes
- Created test component to verify context behavior
- Implemented proper cleanup between tests

### E2E Tests: Authentication Flow
**File:** `e2e-tests/tests/auth-flow.spec.ts`
- ❌ Tests failing due to URL configuration issues
  1. Sign in
  2. Invalid credentials
  3. Sign up
  4. Sign out

**Key Issues Identified:**
- Navigation failing with "Cannot navigate to invalid URL" error
- Updated tests to use absolute URLs (`http://localhost:3000/`)
- Need to configure proper test environment and server

### Firebase Emulator Integration
**File:** `e2e-tests/setup/firebase-emulator.setup.ts`
- ✅ Created emulator setup file
- ✅ Added TypeScript declarations for emulator configuration
- ❌ Need to verify emulator is running during tests

## Updated Timeline

1. **Week 1 (Completed):** Set up testing infrastructure and implement unit tests
2. **Week 2 (In Progress):** ✅ Fix failing tests and complete integration tests
3. **Week 3:** Set up E2E test environment and implement end-to-end tests
4. **Week 4:** Integrate with CI and finalize test coverage

## Next Steps

1. **✅ Fix Firebase Auth Service Tests:**
   - ✅ Update mock user objects to include complete metadata structure
   - ✅ Ensure error messages in tests match implementation
   - ✅ Add defensive coding in `mapFirebaseUserToAuthUser` to handle missing properties

2. **Complete E2E Test Setup:**
   - Configure development server for E2E tests
   - Ensure Firebase emulator is running during tests
   - Update Playwright configuration to use correct base URL

3. **Improve Test Coverage:**
   - Add tests for password reset functionality
   - Add tests for profile updates
   - Add tests for error handling edge cases

4. **CI Integration:**
   - Configure GitHub Actions to run tests automatically
   - Set up Firebase emulator in CI environment

## Success Criteria

1. **Test Coverage**: Achieve at least 80% code coverage for auth-related code
2. **CI Integration**: All tests run automatically in CI pipeline
3. **Documentation**: Complete documentation of testing approach
4. **Reliability**: Tests should be stable and not produce flaky results

## Additional Considerations

1. **Test Data Management**: Create isolated test accounts and data
2. **Environment Variables**: Properly manage environment variables for different test environments
3. **Test Performance**: Optimize tests to run efficiently in CI
4. **Security**: Ensure test credentials are properly secured

## Firebase Version Compatibility

This testing strategy is designed to work with Firebase v10.14.1, which is the version currently used in the project. If upgrading to Firebase v11+ in the future, additional testing capabilities may become available.

## Resources

- [Firebase Testing Documentation](https://firebase.google.com/docs/emulator-suite)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Vitest Documentation](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Related Issues

- #123: Firebase Auth SSR Implementation
- #456: Auth Provider Refactoring
