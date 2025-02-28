# TypeScript Error Resolution Guide

This guide provides strategies for resolving common TypeScript errors in the Teach Niche codebase.

## Common Error Types and Solutions

### Type 'any' is not assignable to type...

This error occurs when TypeScript cannot determine that a value of type `any` matches a more specific type.

```typescript
// Error
const userData: User = someApiResponse; // someApiResponse is 'any'

// Solution
const userData: User = someApiResponse as User;
```

Better solution - add proper type checking:

```typescript
function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.email === 'string';
}

const userData: User = isUser(someApiResponse) 
  ? someApiResponse 
  : { id: '', email: '', displayName: '' }; // default values
```

### Object is possibly 'undefined' or 'null'

```typescript
// Error
const userName = user.name; // user might be undefined

// Solutions
// 1. Optional chaining
const userName = user?.name;

// 2. Non-null assertion (use only when you're certain)
const userName = user!.name;

// 3. Conditional check (safest)
const userName = user ? user.name : '';
```

### Property does not exist on type

```typescript
// Error
interface User { id: string; name: string; }
const user: User = { id: '123', name: 'John' };
console.log(user.email); // Property 'email' does not exist on type 'User'

// Solution
interface User { id: string; name: string; email?: string; }
```

### Firebase-Specific Type Issues

Firebase often requires explicit typing:

```typescript
// Error
const docRef = db.collection('users').doc(userId);

// Solution
import { firestore } from 'firebase-admin';
const docRef: firestore.DocumentReference = db.collection('users').doc(userId);
```

### React Component Props

Always define prop interfaces for components:

```typescript
// Before
function UserProfile(props) {
  return <div>{props.name}</div>;
}

// After
interface UserProfileProps {
  name: string;
  age?: number;
}

function UserProfile({ name, age }: UserProfileProps) {
  return (
    <div>
      {name} {age && `(${age})`}
    </div>
  );
}
```

## Debugging TypeScript Errors

To get more detailed error information:

```bash
npx tsc --noEmit --skipLibCheck --project tsconfig.json path/to/file.ts --traceResolution
```

## Recommended Tools

- **TypeScript Error Translator**: [ts-error-translator.vercel.app](https://ts-error-translator.vercel.app/)
- **VS Code Extensions**:
  - TypeScript Error Translator
  - Error Lens
  - TypeScript Hero

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
