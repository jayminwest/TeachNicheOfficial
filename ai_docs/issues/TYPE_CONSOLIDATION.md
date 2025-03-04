# Issue: Type Consolidation Across Project

## Issue Type
- [x] Refactoring
- [ ] Bug Fix
- [ ] Feature Request
- [ ] Documentation Update

## Priority
- [x] High
- [ ] Medium
- [ ] Low

## Description

We have identified several duplicate and inconsistent type definitions across the codebase. This creates maintenance challenges and potential for bugs when types are updated in one location but not others.

## Current State

The following duplicate types have been identified:

1. **PurchaseStatus** is defined in:
   - `app/services/database/purchasesService.ts`
   - `types/purchase.ts`

2. **LessonAccess** is defined in:
   - `app/services/database/purchasesService.ts`
   - `types/purchase.ts`

3. **LessonRequest** is defined in:
   - `app/lib/schemas/lesson-request.ts`
   - `types/lesson.ts`

4. **LessonRequestStatus** / status string literals are defined in multiple places

## Proposed Solution

1. Consolidate all purchase-related types in `types/purchase.ts`:
   - `PurchaseStatus`
   - `LessonAccess`
   - `PurchaseCreateData`
   - `Purchase`

2. Consolidate all lesson request types in `types/lesson.ts`:
   - `LessonRequest`
   - `LessonRequestStatus`
   - `LessonRequestVote`

3. Update imports in affected files:
   - `app/services/database/purchasesService.ts`
   - `app/lib/schemas/lesson-request.ts`

## Implementation Steps

1. Update `types/purchase.ts` with consolidated purchase types
2. Update `types/lesson.ts` with consolidated lesson request types
3. Update imports in `app/services/database/purchasesService.ts`
4. Update imports in `app/lib/schemas/lesson-request.ts`
5. Run TypeScript checks to ensure everything is working correctly

## Code Changes

### 1. Update `types/purchase.ts`

```typescript
export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'none';

export interface LessonAccess {
  hasAccess: boolean;
  purchaseStatus: PurchaseStatus;
  purchaseDate?: string;
}

export interface PurchaseCreateData {
  lessonId: string;
  userId: string;
  amount: number;
  stripeSessionId: string;
}

export interface Purchase {
  id: string;
  lessonId: string;
  status: PurchaseStatus;
  amount: number;
  createdAt: string;
}
```

### 2. Update `types/lesson.ts`

```typescript
export interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  averageRating: number;
  totalRatings: number;
  created_at: string;
}

export type LessonRequestStatus = 'open' | 'in_progress' | 'completed';

export interface LessonRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  status: LessonRequestStatus;
  vote_count: number;
  user_id: string;
  instagram_handle?: string;
  tags?: string[];
}

export interface LessonRequestVote {
  id: string;
  request_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}
```

### 3. Update `app/services/database/purchasesService.ts`

```typescript
import { DatabaseService, DatabaseResponse } from './databaseService';
import { PurchaseStatus, LessonAccess, PurchaseCreateData, Purchase } from '@/types/purchase';

export class PurchasesService extends DatabaseService {
  // Use the imported types instead of redefining them
  // Rest of the code remains the same
}
```

### 4. Update `app/lib/schemas/lesson-request.ts`

```typescript
import * as z from 'zod';
import { LessonRequest, LessonRequestStatus, LessonRequestVote } from '@/types/lesson';

// Helper function to ensure status is one of the allowed values
export function ensureValidStatus(status: string): LessonRequestStatus {
  if (status === 'open' || status === 'in_progress' || status === 'completed') {
    return status;
  }
  return 'open'; // Default to 'open' if invalid status
}

// Type guard to check if a status string is a valid LessonRequest status
export function isValidStatus(status: string): status is LessonRequestStatus {
  return status === 'open' || status === 'in_progress' || status === 'completed';
}

// Type assertion function for tests
export function assertValidStatus(status: string): asserts status is LessonRequestStatus {
  if (!isValidStatus(status)) {
    throw new Error(`Invalid status: ${status}. Must be 'open', 'in_progress', or 'completed'`);
  }
}

// Rest of the code remains the same
```

## Testing

After implementing these changes:

1. Run TypeScript compiler to check for type errors:
   ```bash
   npm run typecheck
   ```

2. Run tests to ensure functionality is preserved:
   ```bash
   npm test
   ```

3. Verify that the application builds successfully:
   ```bash
   npm run build
   ```

## Additional Notes

This refactoring is part of a larger effort to improve type safety and maintainability across the codebase. Future work may include:

1. Creating a centralized type system with domain-specific type files
2. Standardizing component props with base interfaces
3. Consolidating error types
4. Using discriminated unions for status types

## Related Issues

- None

## Assignees

- TBD

## Labels

- refactoring
- typescript
- maintenance
