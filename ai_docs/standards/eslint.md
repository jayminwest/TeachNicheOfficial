# ESLint Standards

This document outlines our strict ESLint guidelines for the Teach Niche project.

## Core Principles

1. **No Types Allowed**: We strictly prohibit the use of TypeScript or any type annotations
2. **Pure JavaScript**: All code must be written in pure JavaScript
3. **Strict Linting**: We enforce a comprehensive set of ESLint rules

## ESLint Configuration

Our ESLint configuration includes:

```json
{
  "rules": {
    // Prohibit TypeScript
    "no-undef": "error",
    "no-unused-vars": "error",
    
    // Enforce JavaScript best practices
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
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  }
}
```

## Aider Configuration

When using Aider, always include the `--eslint-disable-types` flag to ensure generated code follows our no-types policy:

```bash
aider --model ollama/deepseek-r1:70b --message "Your prompt" --eslint-disable-types
```

## Common Issues and Solutions

### Problem: TypeScript Imports
```javascript
// BAD
import { SomeType } from './types';

// GOOD
import { someFunction } from './utils';
```

### Problem: Type Annotations
```javascript
// BAD
function add(a: number, b: number): number {
  return a + b;
}

// GOOD
function add(a, b) {
  return a + b;
}
```

### Problem: JSDoc with Types
```javascript
// BAD
/**
 * @param {string} name - The name parameter
 * @returns {string} The greeting
 */

// GOOD
/**
 * Creates a greeting for the given name
 * @param name - The name to greet
 * @returns The greeting message
 */
```

## Enforcement

- All PRs are automatically checked for ESLint compliance
- CI/CD pipelines will fail if any type annotations are detected
- Code reviews should specifically check for accidental type usage

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-25 | Documentation Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
