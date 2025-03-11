# Fix: E2E Test Connection Refused Error

## Issue Description

The end-to-end tests are failing with `net::ERR_CONNECTION_REFUSED` errors when attempting to connect to the local development server. This prevents the authentication flow tests from running successfully.

## Reproduction Steps

1. Run the authentication tests with: `PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 npx playwright test auth`
2. Observe that all tests fail with connection refused errors

## Expected Behavior

The tests should be able to connect to the local development server, which should be automatically started by the Playwright configuration.

## Technical Analysis

The error occurs because:
1. The Playwright configuration is attempting to start the development server with `npm run dev`
2. The tests are not waiting properly for the server to be fully available
3. There's no retry mechanism for connection failures

Error message from logs:
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
```

## Potential Causes

1. The development server takes longer to start than the timeout allows
2. There might be port conflicts preventing the server from starting
3. The `webServer` configuration in Playwright might not be properly set up
4. The tests are not handling connection retries

## Likely Affected Files

1. `e2e-tests/playwright.config.ts`
2. `e2e-tests/auth-flows.spec.ts`

## Testing Requirements

To verify the fix:
1. Run the authentication tests with: `PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 npx playwright test auth`
2. Confirm that the tests can connect to the development server
3. Verify that all authentication tests pass

## Environment

- **Browser**: Chrome, Firefox, Safari (via Playwright)
- **Environment**: Development
- **Authentication Provider**: Supabase Auth

## Priority

Medium - This issue blocks the end-to-end testing of authentication flows, which is critical for ensuring the security and functionality of the application.

## Additional Context

The issue appears to be related to the test infrastructure rather than the application code itself. The fix should focus on making the tests more robust when connecting to the development server.
