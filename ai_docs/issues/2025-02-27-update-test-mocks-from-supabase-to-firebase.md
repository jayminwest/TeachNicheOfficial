# Update Test Mocks from Supabase to Firebase

## Objective
Migrate all test mocks and testing infrastructure from Supabase to Firebase while maintaining test coverage and compliance with our Test-Driven Development (TDD) standards.

## Required Changes

### 1. Storage Service Mocks
- Replace Supabase storage mocks with Firebase Storage equivalents
- Update mock authentication flows to use Firebase Authentication
- Implement Firestore document mocks for database interactions

Example Change:
```typescript
// BEFORE: Supabase mock
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
}));

// AFTER: Firebase mock
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn().mockReturnThis(),
  getDocs: jest.fn().mockResolvedValue({
    docs: mockLessonData,
  }),
}));
```

### 2. Authentication Test Updates
- Update auth helper tests to use Firebase Authentication methods
- Implement mock user providers for Firebase auth flows
- Update security test cases to verify Firebase auth integrations

### 3. Payment Service Tests
- Ensure Stripe mocks properly integrate with Firebase user records
- Update payout tests to verify 85% creator / 15% platform split
- Add tests for Stripe processing fee handling

### 4. End-to-End Testing
- Update Playwright tests to validate Firebase integrations:
  ```typescript
  test('should load lesson from Firebase', async ({ page }) => {
    await page.route('**/firestore.googleapis.com/**', route => {
      route.fulfill(json(mockLessonData));
    });
    // Test implementation
  });
  ```

## Implementation Steps

1. Create new `firebase-mocks.ts` utility module
2. Migrate existing Supabase mocks incrementally
3. Update test suites for:
   - User authentication flows
   - Lesson content storage/retrieval
   - Payment transaction records
4. Verify all tests interact with Firebase services instead of Supabase
5. Remove Supabase dependencies from project

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-27 | Testing Team | Initial migration plan |

## Cross-References
- [ARCHITECTURE.md](../core/ARCHITECTURE.md) - Storage and authentication architecture
- [TYPESCRIPT_ERRORS.md](../guides/development/TYPESCRIPT_ERRORS.md) - Error handling standards
- [DOCUMENTATION_USAGE.md](../core/DOCUMENTATION_USAGE.md) - Test implementation guidelines

> **Checklist**
> - [ ] Update unit test mocks
> - [ ] Refactor integration tests
> - [ ] Verify end-to-end test coverage
> - [ ] Remove Supabase dependencies
> - [ ] Update documentation

**Note:** All changes must maintain 100% test coverage and include Playwright tests that validate actual Firebase service integration through our CI/CD pipeline. Special attention required for payment tests - ensure Stripe mocks correctly interact with Firebase user records and payout calculations.
