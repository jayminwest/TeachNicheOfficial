# TypeScript Quality Standards

## Core Requirements

1. Type Safety
- No use of 'any' type
- No type assertions without validation
- All props and returns typed
- Generic types properly constrained

2. Interface Definitions
- Clear and descriptive names
- Proper documentation
- Minimal dependencies
- Single responsibility

3. Type Checking

```typescript
interface TypeCheck {
  severity: 'error' | 'warning';
  category: 'safety' | 'style' | 'performance';
  autofix: boolean;
}

const typeChecks: Record<string, TypeCheck> = {
  noImplicitAny: {
    severity: 'error',
    category: 'safety',
    autofix: false
  },
  strictNullChecks: {
    severity: 'error',
    category: 'safety',
    autofix: false
  },
  noUncheckedIndexedAccess: {
    severity: 'error',
    category: 'safety',
    autofix: false
  }
};
```

## Complexity-Based Requirements

### Simple Changes
- Basic type safety
- Props and returns typed
- No type assertions

### Medium Changes
- Full type safety
- Generic constraints
- Type guards where needed

### Complex Changes
- Advanced type safety
- Custom type guards
- Type testing
- Performance optimization
