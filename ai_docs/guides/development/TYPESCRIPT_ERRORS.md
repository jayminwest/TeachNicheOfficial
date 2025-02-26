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
# TypeScript Errors Guide

This guide provides solutions for common TypeScript errors you might encounter while developing for the Teach Niche platform, with a focus on testing-related TypeScript patterns.

## Common TypeScript Errors

### Type 'X' is not assignable to type 'Y'

This is the most common TypeScript error, indicating a type mismatch.

```typescript
// Error: Type 'string' is not assignable to type 'number'
const price: number = "10.99"; // ❌
```

**Solution:**
```typescript
const price: number = 10.99; // ✅
// Or convert the string to a number
const priceFromString: number = parseFloat("10.99"); // ✅
```

### Property 'X' does not exist on type 'Y'

This error occurs when you try to access a property that doesn't exist on a type.

```typescript
// Error: Property 'price' does not exist on type '{ title: string; }'
const lesson = { title: "Kendama Basics" };
console.log(lesson.price); // ❌
```

**Solution:**
```typescript
// Define the type with all required properties
interface Lesson {
  title: string;
  price?: number; // Optional property
}

const lesson: Lesson = { title: "Kendama Basics" };
console.log(lesson.price); // ✅ (will be undefined)
```

### Object is possibly 'null' or 'undefined'

TypeScript warns you when you try to access properties on an object that might be null or undefined.

```typescript
// Error: Object is possibly 'undefined'
function getLesson(id: string): Lesson | undefined {
  // Implementation might return undefined
}

const lesson = getLesson("123");
console.log(lesson.title); // ❌
```

**Solution:**
```typescript
// Option 1: Optional chaining
console.log(lesson?.title); // ✅

// Option 2: Non-null assertion (use only when you're certain)
console.log(lesson!.title); // Use with caution

// Option 3: Conditional check (safest)
if (lesson) {
  console.log(lesson.title); // ✅
}
```

## Testing-Related TypeScript Patterns

### Mocking Types for Tests

When writing tests, you often need to create mock objects that match specific interfaces.

```typescript
// Interface definition
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'creator' | 'learner';
  createdAt: Date;
}

// Error: Type '{ id: string; name: string; }' is missing properties
const mockUser: User = { id: "123", name: "Test User" }; // ❌
```

**Solution:**
```typescript
// Option 1: Partial type for incomplete mocks
const partialMockUser: Partial<User> = { id: "123", name: "Test User" }; // ✅

// Option 2: Complete mock with all required properties
const completeMockUser: User = {
  id: "123",
  name: "Test User",
  email: "test@example.com",
  role: "learner",
  createdAt: new Date()
}; // ✅

// Option 3: Mock factory function
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: "default-id",
    name: "Default User",
    email: "default@example.com",
    role: "learner",
    createdAt: new Date(),
    ...overrides
  };
}

const customMockUser = createMockUser({ id: "custom-id" }); // ✅
```

### Type Assertions in Tests

Sometimes you need to assert types in tests, especially when testing error cases.

```typescript
// Error: Argument of type 'unknown' is not assignable to parameter of type 'Error'
test('handles errors', async () => {
  try {
    await someFunction();
  } catch (error) {
    expect(error.message).toContain('Failed'); // ❌
  }
});
```

**Solution:**
```typescript
test('handles errors', async () => {
  try {
    await someFunction();
  } catch (error) {
    // Option 1: Type assertion
    expect((error as Error).message).toContain('Failed'); // ✅
    
    // Option 2: Type guard
    if (error instanceof Error) {
      expect(error.message).toContain('Failed'); // ✅
    } else {
      fail('Expected error to be instance of Error');
    }
  }
});
```

### Typing Test Mocks

When mocking functions or modules in tests, you need to ensure proper typing.

```typescript
// Error: Type 'jest.Mock<any, any>' is not assignable to type '(id: string) => Promise<User>'
jest.mock('@/lib/api/users');
const getUser = require('@/lib/api/users').getUser; // ❌
getUser.mockResolvedValue({ id: "123", name: "Test User" });
```

**Solution:**
```typescript
// Option 1: Type the mock function
jest.mock('@/lib/api/users');
const getUser = require('@/lib/api/users').getUser as jest.MockedFunction<typeof import('@/lib/api/users').getUser>; // ✅
getUser.mockResolvedValue({ id: "123", name: "Test User" });

// Option 2: Use jest.spyOn with proper typing
jest.mock('@/lib/api/users');
const usersApi = require('@/lib/api/users');
const getUserSpy = jest.spyOn(usersApi, 'getUser') as jest.SpyInstance<Promise<User>, [string]>; // ✅
getUserSpy.mockResolvedValue({ id: "123", name: "Test User" });
```

### Testing Component Props

When testing React components, you need to ensure props are correctly typed.

```typescript
// Component definition
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

function Button({ variant, onClick, children }: ButtonProps) {
  // Implementation
}

// Error: Type '{ children: string; }' is missing properties
test('renders button', () => {
  render(<Button>Click me</Button>); // ❌
});
```

**Solution:**
```typescript
test('renders button', () => {
  // Provide all required props
  render(
    <Button 
      variant="primary" 
      onClick={() => {}}
    >
      Click me
    </Button>
  ); // ✅
});
```

## TDD-Specific TypeScript Patterns

When following Test Driven Development, you'll often write tests for types and interfaces before implementing them.

### Testing Type Definitions

```typescript
// First, define the types you'll need for your tests
interface Lesson {
  id: string;
  title: string;
  price: number;
  creatorId: string;
}

// Then write tests that use these types
describe('Lesson API', () => {
  it('should create a lesson', async () => {
    const newLesson: Omit<Lesson, 'id'> = {
      title: 'Test Lesson',
      price: 19.99,
      creatorId: 'user-123'
    };
    
    const createdLesson = await createLesson(newLesson);
    
    // TypeScript ensures createdLesson has the correct shape
    expect(createdLesson.id).toBeDefined();
    expect(createdLesson.title).toBe(newLesson.title);
  });
});

// Later, implement the function to match the types
async function createLesson(lesson: Omit<Lesson, 'id'>): Promise<Lesson> {
  // Implementation here
}
```

### Testing Third-Party API Types

When testing integrations with third-party APIs, define types that match the expected responses.

```typescript
// Define types for Stripe API responses
interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  client_secret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded';
}

// Write tests using these types
describe('Stripe Integration', () => {
  it('should create a payment intent', async () => {
    // Test implementation
    const paymentIntent = await createPaymentIntent(1000);
    
    // TypeScript ensures paymentIntent has the correct shape
    expect(paymentIntent.object).toBe('payment_intent');
    expect(paymentIntent.amount).toBe(1000);
  });
});

// Later, implement the function to match the types
async function createPaymentIntent(amount: number): Promise<StripePaymentIntent> {
  // Implementation here
}
```

## Troubleshooting TypeScript in Tests

### Issue: Jest Cannot Find Module

```
Error: Cannot find module '@/components/Button' from 'Button.test.tsx'
```

**Solution:**
Check your Jest configuration in `jest.config.js` to ensure module paths are correctly mapped:

```javascript
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1'
  }
};
```

### Issue: Type Errors in Test Files

```
Error: Property 'toBeInTheDocument' does not exist on type 'Assertion'
```

**Solution:**
Ensure you have the correct type definitions installed and imported:

```bash
npm install --save-dev @testing-library/jest-dom @types/testing-library__jest-dom
```

Then add to your test setup file or individual test files:

```typescript
import '@testing-library/jest-dom';
```

### Issue: Mock Return Types

```
Error: Type 'string' is not assignable to type 'Promise<User>'
```

**Solution:**
Ensure your mocks return the correct types:

```typescript
// Incorrect
userService.getUser.mockReturnValue('user123'); // ❌

// Correct
userService.getUser.mockResolvedValue({ id: 'user123', name: 'Test User' }); // ✅
```

## Best Practices for TypeScript in TDD

1. **Define Types First**: Before implementing features, define the types and interfaces you'll need
2. **Write Type-Safe Tests**: Ensure your tests use proper typing to catch type errors early
3. **Use Type Assertions Sparingly**: Only use type assertions when necessary and you're confident about the type
4. **Create Test Helpers**: Build type-safe test helpers for common testing patterns
5. **Mock with Types**: Always type your mocks to ensure they match the expected interfaces
6. **Test Edge Cases**: Include tests for null/undefined values and other edge cases
7. **Use TypeScript's Utility Types**: Leverage `Partial<T>`, `Omit<T, K>`, `Pick<T, K>`, etc. for flexible typing in tests

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | TypeScript Team | Initial version |
| 1.1 | 2025-02-26 | Documentation Team | Updated to include TDD-specific TypeScript patterns |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
