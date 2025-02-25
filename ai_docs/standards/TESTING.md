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
