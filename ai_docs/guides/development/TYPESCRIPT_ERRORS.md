# TypeScript Error Resolution Guide

This guide provides strategies for resolving common TypeScript errors in the Teach Niche codebase.

## Common Error Types and Solutions

### TS2304: Cannot find name 'X'

This error occurs when you're using a variable, function, or type that hasn't been imported or declared.

```typescript
// Error
const auth = getAuth(getApp());

// Solution
import { getAuth, getApp } from 'firebase/auth';
const auth = getAuth(getApp());
```

For Supabase references that need to be replaced:

```typescript
// Error
await supabase.from('lessons').select('*');

// Solution
import { databaseService } from '@/app/services/database';
await databaseService.query('SELECT * FROM lessons');
```

### TS2339: Property 'X' does not exist on type 'Y'

This error occurs when you're trying to access a property that doesn't exist on an object type.

```typescript
// Error
if (!user?.id) return; // Property 'id' does not exist on type 'User'

// Solution - Check Firebase User properties
if (!user?.uid) return; // Firebase User has 'uid', not 'id'
```

For metadata properties:

```typescript
// Error
user?.metadata?.creatorProfile // Property 'creatorProfile' does not exist on type 'UserMetadata'

// Solution - Create a type guard or interface extension
interface ExtendedUserMetadata extends UserMetadata {
  creatorProfile?: boolean;
  is_creator?: boolean;
}

// Then use type assertion
(user?.metadata as ExtendedUserMetadata)?.creatorProfile
```

For Firebase User vs. Custom User types:

```typescript
// Error in app/__tests__/test-utils.tsx
isCreator: () => Boolean(user?.metadata?.creatorProfile || user?.metadata?.is_creator)

// Solution
import { UserMetadata } from 'firebase/auth';

interface ExtendedUserMetadata extends UserMetadata {
  creatorProfile?: boolean;
  is_creator?: boolean;
}

isCreator: () => Boolean(
  ((user?.metadata as ExtendedUserMetadata)?.creatorProfile || 
   (user?.metadata as ExtendedUserMetadata)?.is_creator)
)
```

### TS7006: Parameter 'X' implicitly has an 'any' type

This error occurs when a function parameter doesn't have a type annotation.

```typescript
// Error
.map(item => ({ id: item.id }))

// Solution
.map((item: { id: string; amount: number }) => ({ id: item.id }))
```

### TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'

This error is common in test files where mock objects don't match expected types.

```typescript
// Error
const result = await GET(req); // MockRequest not assignable to Request

// Solution
const result = await GET(req as unknown as Request);
```

### TS18046: 'X' is of type 'unknown'

This error occurs when you try to access properties on a value of type 'unknown'.

```typescript
// Error
if (result.error) { // 'result' is of type 'unknown'

// Solution
if ((result as { error?: Error }).error) {
  // Now TypeScript knows error might exist
}
```

### TS2416: Property 'X' in type 'Y' is not assignable to the same property in base type 'Z'

This error occurs when a class method's signature doesn't match its interface.

```typescript
// Error
// Interface
interface StorageService {
  deleteFile(path: string): Promise<void>;
}

// Implementation
async deleteFile(path: string): Promise<boolean> { // Return type mismatch
  // ...
}

// Solution
async deleteFile(path: string): Promise<void> {
  // Don't return a value
}
```

### TS2322: Type 'X' is not assignable to type 'Y'

This error occurs when you're trying to assign a value of one type to a variable of another type.

```typescript
// Error
const storageService: StorageService = new FirebaseStorage();
// Type 'FirebaseStorage' is not assignable to type 'StorageService'

// Solution
// Fix the implementation to match the interface exactly
```

For component prop type errors, you may need to update the component's interface:

```typescript
// Error
<Alert variant="warning"> // Type '"warning"' is not assignable to type '"default" | "destructive"'

// Solution
// Update the Alert component's interface to include the new variant
interface AlertProps {
  variant?: "default" | "destructive" | "warning";
  // other props...
}
```

### TS2554: Expected X arguments, but got Y

This error occurs when you're calling a function with the wrong number of arguments.

```typescript
// Error
await emailService.sendWelcomeEmail(email, name, inviteLink);
// Expected 2 arguments, but got 3

// Solution
// Check the function signature and adjust the call
await emailService.sendWelcomeEmail(email, name);
// Or update the function to accept the third parameter
```

## Debugging TypeScript Errors

To get more detailed error information:

```bash
npx tsc --noEmit --skipLibCheck --project tsconfig.json path/to/file.ts --traceResolution
```

For a specific error code explanation:

```bash
npx tsc --explainCode TS2345
```

## Recommended Tools

- **TypeScript Error Translator**: [ts-error-translator.vercel.app](https://ts-error-translator.vercel.app/)
- **VS Code Extensions**:
  - TypeScript Error Translator
  - Error Lens
  - TypeScript Hero
- **Type-Check Single File**:
  ```bash
  npx tsc --noEmit --skipLibCheck app/services/database/cloud-sql.ts
  ```

## When to Use Type Assertions

Type assertions (`as Type`) should be used sparingly and only when:

1. You have more information than TypeScript does about a value's type
2. You're working with third-party libraries that don't have proper type definitions
3. You're migrating JavaScript code to TypeScript

```typescript
// Acceptable use case
const element = document.getElementById('root') as HTMLDivElement;
```

## When to Create Type Guards

Type guards are functions that perform runtime checks to guarantee the type of a value:

```typescript
function isLessonData(obj: any): obj is LessonData {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.title === 'string' && 
    typeof obj.price === 'number';
}

// Usage
if (isLessonData(data)) {
  // TypeScript knows data is LessonData here
  console.log(data.title);
}
```

## Firebase-Specific Type Solutions

### Firestore Document References

```typescript
import { DocumentReference, DocumentData } from 'firebase/firestore';

// Properly type document references
const userDocRef: DocumentReference<DocumentData> = doc(db, 'users', userId);

// For custom types
interface User {
  id: string;
  name: string;
  email: string;
}

const userDocRef: DocumentReference<User> = doc(db, 'users', userId) as DocumentReference<User>;
```

### Firebase Storage References

```typescript
import { StorageReference } from 'firebase/storage';

// Properly type storage references
const fileRef: StorageReference = ref(storage, `files/${fileId}`);
```

### Firebase Auth Types

```typescript
import { User as FirebaseUser } from 'firebase/auth';

// Type guard for Firebase User
function isFirebaseUser(user: any): user is FirebaseUser {
  return user && typeof user.uid === 'string';
}

// Usage
if (isFirebaseUser(currentUser)) {
  // TypeScript knows currentUser is FirebaseUser here
  console.log(currentUser.uid);
}
```

### Migrating from Supabase to Firebase

When replacing Supabase references:

```typescript
// Before
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .eq('status', 'published');

// After with DatabaseService
const { rows: data } = await databaseService.query<LessonRecord[]>(
  'SELECT * FROM lessons WHERE status = $1',
  ['published']
);

// After with Firebase Firestore
import { collection, query, where, getDocs } from 'firebase/firestore';
const lessonsRef = collection(db, 'lessons');
const q = query(lessonsRef, where('status', '==', 'published'));
const snapshot = await getDocs(q);
const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

## References

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Firebase TypeScript Guide](https://firebase.google.com/docs/reference/js)
- [Type-Safe Firebase](https://fireship.io/lessons/typescript-firebase-google-cloud/)

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-25 | Documentation Team | Initial version |
| 1.1 | 2025-02-28 | TypeScript Team | Added Firebase-specific type solutions |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
