# End-to-End Testing with Playwright

This directory contains end-to-end tests for the Teach Niche platform using Playwright.

## Overview

These tests verify complete user journeys through the application, ensuring that critical flows work correctly across different browsers and devices.

## Test Structure

- `auth-flows.spec.ts`: Tests for user authentication (sign up, login, etc.)
- `lesson-purchase.spec.ts`: Tests for browsing, previewing, and purchasing lessons
- More test files will be added as new features are developed

## Running Tests

```bash
# Install Playwright browsers if not already installed
npx playwright install

# Run all tests
npx playwright test

# Run a specific test file
npx playwright test lesson-purchase.spec.ts

# Run tests with UI mode (for debugging)
npx playwright test --ui

# Run tests on a specific browser
npx playwright test --project=Chrome
```

## Test Data

Tests use a combination of:
- Generated test data (unique emails, etc.)
- Existing test accounts in the development environment
- Mocked API responses for external services like Stripe

## Best Practices

1. **Isolation**: Each test should be independent and not rely on state from other tests
2. **Readability**: Tests should be clear about what they're testing
3. **Stability**: Avoid flaky tests by using proper waiting strategies
4. **Coverage**: Tests should cover all critical user journeys
5. **Performance**: Tests should run as quickly as possible

## Adding New Tests

When adding new features, create corresponding Playwright tests that verify:
1. The feature works correctly in isolation
2. The feature integrates properly with the rest of the application
3. The feature works across all supported browsers and devices

## Debugging Failed Tests

When tests fail, Playwright provides several debugging tools:
- Screenshots of the failure state
- Video recordings of the test run
- Traces that can be viewed in the Playwright Trace Viewer

To view a trace:
```bash
npx playwright show-trace trace.zip
```

## CI Integration

These tests run automatically in the CI pipeline on pull requests and before deployment to ensure that changes don't break critical user journeys.
