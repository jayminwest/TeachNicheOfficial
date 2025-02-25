# Code Style Guidelines

This document outlines the coding style guidelines for the Teach Niche project. These guidelines are language-agnostic and focus on general principles that apply across different programming languages and frameworks.

## General Principles

### 1. Consistency

- Follow established patterns in the codebase
- Use consistent naming, formatting, and organization
- When in doubt, match the surrounding code

### 2. Readability

- Write code for humans first, computers second
- Prioritize clarity over cleverness
- Use descriptive names that reveal intent

### 3. Simplicity

- Keep functions, methods, and components small and focused
- Avoid unnecessary complexity
- Prefer explicit over implicit

### 4. Maintainability

- Write code that is easy to modify and extend
- Consider future developers (including your future self)
- Document non-obvious decisions and edge cases

## Naming Conventions

### Variables and Functions

- Use descriptive, intention-revealing names
- Avoid abbreviations unless they are well-known
- Follow language-specific conventions for casing:
  - camelCase for JavaScript/TypeScript variables and functions
  - PascalCase for React components and classes
  - snake_case for database fields
  - kebab-case for CSS classes and HTML attributes

### Examples

```typescript
// Good
const userProfile = getUserProfile(userId);
function calculateTotalPrice(items, taxRate) { ... }

// Bad
const data = getData(id);
function calc(i, t) { ... }
```

## Formatting

- Use consistent indentation (2 spaces recommended)
- Limit line length to 100 characters
- Use whitespace to improve readability
- Place opening braces on the same line as the statement
- Use semicolons where appropriate for the language

## Comments

- Write self-documenting code that minimizes the need for comments
- Use comments to explain "why", not "what" or "how"
- Keep comments up-to-date with code changes
- Use JSDoc or similar for API documentation

```typescript
// Good
// Retry up to 3 times to handle potential network flakiness
function fetchWithRetry() { ... }

// Bad
// Get user data
function getUser() { ... }
```

## Error Handling

- Handle errors explicitly and gracefully
- Provide meaningful error messages
- Avoid swallowing errors without logging
- Use appropriate error handling mechanisms for the language/framework

## Testing

- Write testable code with clear dependencies
- Test both success and failure cases
- Keep tests readable and maintainable
- Follow the Arrange-Act-Assert pattern

## Language-Specific Guidelines

For detailed, language-specific guidelines, refer to:

- [TypeScript Style Guide](./typescript.md)
- [React Style Guide](./react.md)
- [CSS/SCSS Style Guide](./css.md)
- [SQL Style Guide](./sql.md)

## Enforcement

- Use linters and formatters to automate style enforcement
- Configure CI to validate style compliance
- Address style issues during code review
- Prioritize consistency over personal preference

Remember that these guidelines exist to help create maintainable, high-quality code. They should be applied with judgment rather than dogmatically.
