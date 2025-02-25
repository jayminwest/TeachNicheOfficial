# TypeScript Error Resolution Guide

This guide provides solutions for common TypeScript errors encountered in the Teach Niche project.

## Common Error Types

### Type Mismatch Errors

These occur when a value doesn't match its expected type:

```typescript
// Error: Type 'string' is not assignable to type '"open" | "in_progress" | "completed"'
const status: "open" | "in_progress" | "completed" = "pending"; // ❌
const status: "open" | "in_progress" | "completed" = "open"; // ✅
```

### Missing Properties

When an object is missing required properties:

```typescript
// Error: Property 'required_prop' is missing in type '{ optional_prop: string; }'
interface MyInterface {
  required_prop: string;
  optional_prop?: string;
}

const obj: MyInterface = { optional_prop: "value" }; // ❌
const obj: MyInterface = { required_prop: "value" }; // ✅
```

### Object Possibly Undefined/Null

When TypeScript can't guarantee an object exists:

```typescript
// Error: Object is possibly 'undefined'
const element = document.querySelector('.my-element');
element.textContent = 'New text'; // ❌

// Solutions:
element?.textContent = 'New text'; // Optional chaining
// or
if (element) element.textContent = 'New text'; // Guard clause
// or
const element = document.querySelector('.my-element')!; // Non-null assertion (use cautiously)
```

## Test-Specific Issues

### Mock Response Objects

When mocking `NextResponse` objects in tests:

```typescript
// Error: Type '{ status: number; body: any; }' is not assignable to type 'NextResponse<unknown>'
const mockResponse = { 
  status: 200, 
  body: { data: [] } 
}; // ❌

// Solution: Use the actual NextResponse or create a more complete mock
import { NextResponse } from 'next/server';
const mockResponse = NextResponse.json({ data: [] }, { status: 200 }); // ✅
```

### Test Environment Variables

For environment variables in tests:

```typescript
// Error: Cannot assign to 'NODE_ENV' because it is a read-only property
process.env.NODE_ENV = 'test'; // ❌

// Solution: Use jest.mock for environment variables
jest.mock('process', () => ({
  ...process,
  env: { ...process.env, NODE_ENV: 'test' }
})); // ✅
```

### Function Parameter Types in Tests

Always type test function parameters:

```typescript
// Error: Parameter 'page' implicitly has an 'any' type
async function login(page) { // ❌

// Solution: Add proper typing
async function login(page: Page) { // ✅
```

## Fixing Common Errors

### In Test Files

1. **Mock NextResponse properly**:
   ```typescript
   // Instead of custom objects:
   jest.mocked(NextResponse.json).mockImplementation((data, options) => {
     return NextResponse.json(data, options) as NextResponse<unknown>;
   });
   ```

2. **Type your test data**:
   ```typescript
   const mockRequest: LessonRequest = {
     id: 'request-123',
     title: 'Test Request',
     status: 'open', // Use literal values from the union type
     // ... other properties
   };
   ```

3. **Handle nullable objects safely**:
   ```typescript
   const element = page.querySelector('button');
   if (element && element.parentNode) {
     // Now TypeScript knows these aren't null
     const parent = element.parentNode;
   }
   ```

### In Component Tests

1. **Match prop types exactly**:
   ```typescript
   // If a component expects:
   interface Props {
     status: 'open' | 'in_progress' | 'completed';
   }
   
   // Your test should provide:
   render(<Component status="open" />); // Not status="invalid-status"
   ```

2. **Use type assertions when necessary**:
   ```typescript
   // When you're certain your mock data is valid but TypeScript disagrees:
   render(<Component data={mockData as ExpectedType} />);
   ```

## Best Practices

1. **Avoid `any`**: Use specific types instead of `any`
2. **Use TypeScript assertions sparingly**: Only when you're certain about the type
3. **Create proper interfaces** for test data
4. **Use type guards** to handle nullable values
5. **Keep test mocks aligned** with the actual implementation types

## Getting Help

If you encounter TypeScript errors not covered in this guide:

1. Check the TypeScript documentation
2. Review the error message carefully - it often tells you exactly what's wrong
3. Ask in the #dev-help Slack channel

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-25 | Documentation Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
