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

## Files Requiring Updates

### Test Files with Supabase Mocks
1. `./app/requests/components/__tests__/request-card.test.tsx` - Mocks `@supabase/auth-helpers-nextjs`
2. `./app/requests/components/__tests__/request-dialog.test.tsx` - Mocks `@/app/lib/supabase/requests`
3. `./app/requests/components/__tests__/request-grid.test.tsx` - Mocks `@/app/lib/supabase/requests` and `@supabase/auth-helpers-nextjs`
4. `./app/requests/__tests__/page.test.tsx` - Mocks `@/app/lib/supabase/requests`
5. `./app/components/ui/__tests__/sign-in.test.tsx` - Mocks `@/app/services/auth/supabaseAuth`
6. `./app/components/ui/__tests__/header.test.tsx` - Mocks `@/app/services/supabase`
7. `./app/components/ui/__tests__/sign-up.test.tsx` - Mocks `@/app/services/auth/supabaseAuth`
8. `./app/profile/__tests__/page.test.tsx` - Mocks `@/app/services/supabase`
9. `./app/api/mux/__tests__/mux.test.ts` - Mocks `../../../lib/supabase/client`
10. `./app/api/__tests__/requests.test.ts` - Mocks `@supabase/auth-helpers-nextjs`
11. `./app/api/__tests__/vote.test.ts` - Mocks `@supabase/auth-helpers-nextjs`
12. `./app/api/lessons/__tests__/lessons.test.ts` - Mocks `../../../lib/supabase/client`

### Files Using createClient
1. `./app/api/mux/__tests__/mux.test.ts`
2. `./app/api/lessons/__tests__/lessons.test.ts`

### Additional Test Files That May Need Updates
1. `./app/__tests__/components/ui/lesson-access-gate.test.tsx`
2. `./app/about/__tests__/page.test.tsx`
3. `./app/api/checkout/__tests__/checkout.test.ts`
4. `./app/components/ui/__tests__/earnings-link-integration.test.tsx`
5. `./app/components/ui/__tests__/lesson-card.test.tsx`
6. `./app/components/ui/__tests__/lesson-form.test.tsx`
7. `./app/components/ui/__tests__/markdown-editor.test.tsx`
8. `./app/components/ui/__tests__/video-player.test.tsx`
9. `./app/components/ui/__tests__/video-status.test.tsx`
10. `./app/components/ui/card/__tests__/card.test.tsx`
11. `./app/components/ui/dialog/__tests__/dialog.test.tsx`
12. `./app/components/ui/earnings-link.test.tsx`
13. `./app/components/ui/lesson-card/__tests__/lesson-card.test.tsx`
14. `./app/components/ui/lesson-grid/__tests__/lesson-grid.test.tsx`
15. `./app/components/ui/lesson-preview-dialog/__tests__/lesson-preview-dialog.test.tsx`
16. `./app/dashboard/__tests__/dashboard-page.test.tsx`
17. `./app/dashboard/earnings/__tests__/earnings-page.test.tsx`
18. `./app/lib/__tests__/constants.test.ts`
19. `./app/profile/components/__tests__/profile-form.test.tsx`
20. `./app/requests/components/__tests__/request-sidebar.test.tsx`

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
| 1.1 | 2025-02-27 | Testing Team | Added comprehensive list of files requiring updates |

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
