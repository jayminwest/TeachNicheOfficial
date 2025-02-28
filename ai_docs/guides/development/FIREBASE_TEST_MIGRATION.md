# Firebase Test Migration Guide

This guide provides step-by-step instructions for migrating test mocks from Supabase to Firebase.

## Overview

As part of our platform migration from Supabase to Firebase, all test mocks need to be updated to use Firebase services. This includes:

- Authentication mocks
- Database queries
- Storage operations
- Security rules testing

## Using the Firebase Mock Utilities

We've created a centralized mock utility for Firebase services at `__mocks__/firebase/index.ts`. This provides consistent mocking across all tests.

### Basic Usage

```typescript
// Import the mock utilities
import { 
  mockUserData, 
  mockLessonData, 
  setupFirebaseMocks,
  createMockQuerySnapshot 
} from '__mocks__/firebase';

// Setup all Firebase mocks at once
setupFirebaseMocks();

// Or mock specific Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({
    currentUser: mockUserData,
    // other auth methods...
  })
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn().mockReturnThis(),
  getDocs: jest.fn().mockResolvedValue({
    docs: mockLessonData
  })
}));
```

## Migration Patterns

### 1. Authentication Mocks

#### Before (Supabase):
```typescript
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn().mockReturnValue({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-123', email: 'test@example.com' } } }
      })
    }
  })
}));
```

#### After (Firebase):
```typescript
jest.mock('@/app/services/auth/firebase-auth', () => ({
  firebaseAuth: {
    getSession: jest.fn().mockResolvedValue({
      data: { 
        session: { 
          user: { 
            uid: 'user-123', 
            email: 'test@example.com' 
          } 
        } 
      },
      error: null
    })
  }
}));
```

### 2. Database Queries

#### Before (Supabase):
```typescript
jest.mock('@/app/lib/supabase/client', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: 'lesson-1', title: 'Test Lesson' },
      error: null
    })
  })
}));
```

#### After (Firebase):
```typescript
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn().mockReturnValue('lessons-collection'),
  doc: jest.fn().mockReturnValue('lesson-doc-ref'),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ id: 'lesson-1', title: 'Test Lesson' })
  })
}));
```

### 3. Storage Operations

#### Before (Supabase):
```typescript
jest.mock('@/app/lib/supabase/client', () => ({
  createClient: jest.fn().mockReturnValue({
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-file.jpg' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test-file.jpg' } })
      })
    }
  })
}));
```

#### After (Firebase):
```typescript
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn().mockReturnThis(),
  uploadBytes: jest.fn().mockResolvedValue({
    ref: { fullPath: 'uploads/test-file.jpg' }
  }),
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/test-file.jpg')
}));
```

## Testing with Playwright

For end-to-end tests with Playwright, use request interception to mock Firebase API responses:

```typescript
test('should display user lessons', async ({ page }) => {
  // Mock Firestore API response
  await page.route('**/firestore.googleapis.com/**', route => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        documents: [
          {
            name: 'projects/teachnicheofficial/databases/(default)/documents/lessons/lesson-1',
            fields: {
              title: { stringValue: 'Test Lesson 1' },
              description: { stringValue: 'Test description' },
              price: { integerValue: '1999' }
            },
            createTime: '2025-02-01T00:00:00.000000Z',
            updateTime: '2025-02-01T00:00:00.000000Z'
          }
        ]
      })
    });
  });

  // Test implementation
  await page.goto('/dashboard');
  await expect(page.getByText('Test Lesson 1')).toBeVisible();
});
```

## Common Migration Issues

### 1. Authentication State

Firebase uses `onAuthStateChanged` instead of Supabase's session management. Make sure your mocks handle this difference.

### 2. Document References vs. Data

Firebase separates document references from their data. Use `doc()` and `getDoc()` instead of Supabase's `from().select()`.

### 3. Query Structure

Firebase queries use `where()`, `orderBy()`, etc., instead of Supabase's fluent API. Adjust your mocks accordingly.

### 4. Error Handling

Firebase typically uses try/catch instead of Supabase's `{ data, error }` pattern. Update your error mocks to throw exceptions when needed.

## Migration Checklist

For each test file:

1. ✅ Identify Supabase imports and mocks
2. ✅ Replace with equivalent Firebase imports
3. ✅ Update mock implementations
4. ✅ Adjust test assertions if necessary
5. ✅ Verify tests pass with new mocks
6. ✅ Remove any remaining Supabase dependencies

## Need Help?

If you encounter issues during migration, refer to:
- [Firebase JavaScript SDK documentation](https://firebase.google.com/docs/reference/js)
- The mock examples in `__mocks__/firebase/index.ts`
- The architecture documentation in `ai_docs/core/ARCHITECTURE.md`

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-27 | Testing Team | Initial migration guide |
