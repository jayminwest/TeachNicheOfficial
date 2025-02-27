# E2E Testing Setup Guide

This document outlines the basic setup and standards for end-to-end testing in the Teach Niche platform.

## Overview

End-to-end (E2E) testing verifies that all components of the application work together as expected from a user's perspective. We use Playwright as our E2E testing framework.

## Basic Setup

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Install browser binaries
npx playwright install
```

## Project Structure

```
e2e-tests/
├── auth/                  # Authentication tests
├── lessons/               # Lesson browsing and purchase tests
├── creator/               # Creator dashboard tests
├── profile/               # User profile tests
├── fixtures/              # Test fixtures and helpers
└── utils/                 # Utility functions
```

## Test Organization

Organize tests by user journey:

- **Authentication**: Sign up, sign in, password reset
- **Lessons**: Browsing, purchasing, viewing
- **Creator**: Content upload, management, analytics
- **Profile**: User settings, payment methods

## Test Naming Conventions

- Test files: `feature-name.spec.ts`
- Test descriptions: Should clearly describe the behavior being tested
- Format: `describe('Feature', () => { test('should do something', async () => {...}) })`

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e-tests/auth/sign-in.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests in UI mode
npx playwright test --ui
```

## CI Integration

Tests automatically run on:
- Pull requests to main/dev branches
- Pushes to main/dev branches
- Manual triggers via GitHub Actions

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after tests
3. **Selectors**: Use data-testid attributes for element selection
4. **Assertions**: Make specific, focused assertions
5. **Timeouts**: Set appropriate timeouts for async operations

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 0.1 | 2025-02-25 | Testing Team | Initial setup |

---

*This is a living document. Updates will be made as our testing infrastructure evolves.*
# Testing Standards

This document outlines the testing standards for the Teach Niche platform. All team members must adhere to these standards to ensure code quality, reliability, and maintainability.

## Test Driven Development (TDD)

### Core Principles

1. **Tests First**: Always write tests before implementing any feature or component.
2. **Red-Green-Refactor**: Follow the TDD cycle:
   - Write a failing test (Red)
   - Implement the minimum code to make the test pass (Green)
   - Refactor the code while keeping tests passing (Refactor)
3. **Small Iterations**: Work in small, testable increments
4. **Complete Coverage**: Ensure all code paths are tested

### Required Practice

TDD is not optional. All new features, components, and bug fixes must follow the TDD approach:

1. Write a failing test that defines the expected behavior
2. Implement the minimum code necessary to pass the test
3. Refactor for clarity and performance while maintaining passing tests
4. Commit both tests and implementation together

## Test Types and Requirements

### Unit Tests

- Test individual functions, hooks, and components in isolation
- Mock dependencies and external services
- Focus on a single unit of functionality
- Should comprise the majority of tests (70-80%)
- Required for all utility functions, hooks, and components

### Integration Tests

- Test interactions between multiple units
- Verify that components work together correctly
- Focus on boundaries between components and services
- Should comprise approximately 15-20% of tests

### End-to-End (E2E) Tests

- Test complete user flows from start to finish
- Use Playwright to automate browser interactions
- Verify that the application works as expected from a user's perspective
- Should comprise approximately 5-10% of tests
- Must include tests for critical user journeys:
  - Authentication flows
  - Content creation and consumption
  - Payment processes
  - Account management

### Third-Party API Testing

- Start with mocked API responses for basic test coverage
- Progressively add tests that interact with actual third-party APIs:
  - Stripe for payment processing
  - Supabase for authentication and data storage
  - Mux for video processing
- Use separate test accounts/environments for third-party services
- Include error handling and edge cases
- Document required API keys and setup in the test files

## Test Organization

### File Structure

- Place unit and integration tests in `__tests__` directories adjacent to the code being tested
- Name test files with `.test.ts` or `.test.tsx` extensions
- Place E2E tests in the `e2e-tests` directory at the project root
- Group E2E tests by feature or user journey

### Naming Conventions

- Test files: `[component-or-function-name].test.tsx`
- Test suites: `describe('ComponentName', () => {...})`
- Test cases: `it('should do something specific', () => {...})`
- Use clear, descriptive names that explain the expected behavior

## Testing Tools

### Required Tools

- **Jest**: For unit and integration testing
- **React Testing Library**: For component testing
- **Playwright**: For E2E testing
- **MSW (Mock Service Worker)**: For API mocking
- **Zod**: For schema validation in tests

### Test Utilities

- Use the provided test utilities in `app/__tests__/test-utils.tsx`
- Create and share reusable test helpers
- Document any new test utilities you create

## Coverage Requirements

- Minimum 80% overall code coverage
- 100% coverage for critical paths:
  - Authentication
  - Payment processing
  - Data mutations
- Coverage reports are generated automatically in CI/CD pipelines
- Local coverage reports can be generated with `npm run test:coverage`

## Testing Third-Party Integrations

### Stripe Testing

- Use Stripe test mode for all development and testing
- Test the complete payment flow with test cards
- Verify webhook handling with the Stripe CLI
- Test error cases (insufficient funds, expired cards, etc.)
- Verify correct calculation of platform fees and creator earnings

### Supabase Testing

- Use a dedicated test project for Supabase integration tests
- Test authentication flows (sign up, sign in, password reset)
- Verify database operations and RLS policies
- Test real-time subscription functionality

### Mux Testing

- Test video upload and processing
- Verify playback functionality
- Test adaptive streaming capabilities
- Verify access control for protected content

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on the state from other tests
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
3. **Use Realistic Data**: Test with realistic inputs and edge cases
4. **Keep Tests Fast**: Optimize tests to run quickly
5. **Readable Tests**: Write clear, self-documenting tests
6. **Test Error Cases**: Verify that code handles errors gracefully
7. **Avoid Test Duplication**: Don't repeat the same test logic
8. **Continuous Testing**: Run tests frequently during development

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | Testing Team | Initial version |
| 1.1 | 2025-02-26 | Documentation Team | Updated to emphasize TDD and third-party API testing |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
