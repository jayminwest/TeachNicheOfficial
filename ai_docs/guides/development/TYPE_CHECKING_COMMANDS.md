# Type Checking Commands

This document provides useful commands for checking and fixing TypeScript errors in the Teach Niche codebase.

## Basic Type Checking

Check all TypeScript files in the project:

```bash
npm run type-check
```

Check a specific file:

```bash
npx tsc --noEmit --skipLibCheck app/services/database/cloud-sql.ts
```

## Focused Error Checking

Check files in a specific directory:

```bash
npx tsc --noEmit --skipLibCheck app/services/**/*.ts
```

Check files matching a pattern:

```bash
npx tsc --noEmit --skipLibCheck "app/**/*.{ts,tsx}" --excludeDirectories node_modules
```

## Error Explanation

Get explanation for a specific error code:

```bash
npx tsc --explainCode TS2345
```

## Advanced Debugging

Trace type resolution for a file:

```bash
npx tsc --noEmit --skipLibCheck --project tsconfig.json app/services/database/cloud-sql.ts --traceResolution
```

Show verbose output:

```bash
npx tsc --noEmit --skipLibCheck --verbose app/services/database/cloud-sql.ts
```

## Fixing Common Errors

### Fix Missing Imports

For Firebase imports:

```bash
# Add Firebase imports
npm install --save firebase firebase-admin
```

### Fix Type Definition Issues

```bash
# Install type definitions
npm install --save-dev @types/node @types/react @types/react-dom
```

### Fix Test-Related Type Issues

```bash
# Install Jest types
npm install --save-dev @types/jest
```

### Fix Request Type Issues in Tests

For test files with Request type errors:

```typescript
// Add this helper function to your test utilities
function asRequest(mockRequest: any): Request {
  return mockRequest as unknown as Request;
}

// Then use it in tests
const response = await POST(asRequest(req));
```

### Fix Unknown Type Errors

For TS18046 errors ('X' is of type 'unknown'):

```typescript
// Create a type guard
function hasDataSession(obj: unknown): obj is { data: { session: any } } {
  return obj !== null && 
         typeof obj === 'object' && 
         'data' in obj && 
         obj.data !== null &&
         typeof obj.data === 'object' &&
         'session' in obj.data;
}

// Then use it
if (hasDataSession(session) && session.data.session) {
  // TypeScript now knows the structure
}
```

## Batch Processing

Check files one category at a time:

```bash
# Check Core Services
npx tsc --noEmit --skipLibCheck "app/services/**/*.ts"

# Check UI Components
npx tsc --noEmit --skipLibCheck "app/components/**/*.tsx"

# Check API Routes
npx tsc --noEmit --skipLibCheck "app/api/**/*.ts"
```

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-28 | TypeScript Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
