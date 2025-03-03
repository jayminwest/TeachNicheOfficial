# E2E Tests

This directory contains end-to-end tests for the application using Playwright.

## Test Categories

- **Visual Tests**: Tests that capture screenshots and compare them against baselines
- **Accessibility Tests**: Tests that check for WCAG compliance and keyboard navigation
- **Performance Tests**: Tests that measure and validate performance metrics
- **Network Tests**: Tests that simulate different network conditions

## Running Tests

To run all tests:
```bash
npx playwright test
```

To run a specific test category:
```bash
npx playwright test --project="Chrome"
npx playwright test --project="Accessibility Tests"
npx playwright test --project="Performance Tests"
npx playwright test --project="Slow Network"
```

To update visual test baselines:
```bash
npx playwright test --update-snapshots
```
