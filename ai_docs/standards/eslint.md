# TypeScript ESLint Standards

This document outlines our strict ESLint guidelines for TypeScript in the Teach Niche project.

## Core Principles

1. **Strong Type Safety**: We require proper TypeScript usage throughout the codebase
2. **Strict TypeScript Configuration**: We use the strictest TypeScript compiler options
3. **Comprehensive Linting**: We enforce a robust set of ESLint rules

## ESLint Configuration

Our ESLint configuration includes:

```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    // TypeScript specific rules
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/prefer-interface": "off",
    "@typescript-eslint/no-empty-interface": "error",
    
    // General code quality
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "no-var": "error",
    "prefer-const": "error",
    "no-console": "warn",
    
    // Formatting
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "project": "./tsconfig.json",
    "ecmaFeatures": {
      "jsx": true
    }
  }
}
```

## TypeScript Configuration

Our `tsconfig.json` uses strict settings:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

## Best Practices

### Proper Type Imports
```typescript
// GOOD
import type { User, Profile } from './types';
import { fetchUser } from './api';

// BAD - mixing type imports with value imports
import { User, fetchUser } from './api';
```

### Type Definitions
```typescript
// GOOD
interface UserProps {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

// BAD - using type alias for object types
type UserProps = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};
```

### Function Typing
```typescript
// GOOD
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// BAD - missing return type
function greet(name: string) {
  return `Hello, ${name}!`;
}
```

### React Component Types
```typescript
// GOOD
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  disabled = false 
}) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};

// BAD - implicit any props
const Button = (props) => {
  return (
    <button onClick={props.onClick} disabled={props.disabled}>
      {props.label}
    </button>
  );
};
```

## Enforcement

- All PRs are automatically checked for TypeScript and ESLint compliance
- CI/CD pipelines will fail if any TypeScript errors are detected
- Code reviews should specifically check for proper type usage
- No use of `any` or `as` type assertions without explicit justification

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-25 | Documentation Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
