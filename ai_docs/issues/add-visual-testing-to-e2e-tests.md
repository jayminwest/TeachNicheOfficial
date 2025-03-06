# Feature: Add Visual Regression Testing to E2E Test Suite

## Issue Description

Our E2E tests currently verify functional behavior but don't detect visual regressions. We need to implement visual testing to ensure UI components maintain their expected appearance across releases. This is especially important for our authentication flows and other critical user interfaces.

## Implementation Steps

1. Configure Playwright for visual testing
2. Create baseline screenshots for critical UI components
3. Implement visual comparison helpers
4. Add visual tests for authentication flows
5. Integrate visual testing into CI pipeline
6. Document visual testing workflow for developers

## Expected Behavior

- Visual tests should detect unintended UI changes
- Tests should compare screenshots against baseline images
- Dynamic content should be masked to prevent false positives
- Failed tests should show visual diffs highlighting the changes
- Developers should be able to easily update baselines when UI changes are intentional

## Technical Analysis

Visual testing requires:

1. **Consistent Test Environment**: Tests must run in a consistent environment to avoid false positives
2. **Screenshot Comparison**: Pixel-by-pixel comparison with configurable thresholds
3. **Dynamic Content Handling**: Mechanism to mask areas with dynamic content
4. **Diff Visualization**: Clear visualization of detected differences
5. **Baseline Management**: Process for updating baseline images

## Potential Implementation Approach

1. **Visual Testing Configuration**:
   - Create a dedicated Playwright project for visual tests
   - Configure consistent viewport size and theme
   - Set appropriate comparison thresholds

2. **Helper Functions**:
   - Create a `compareScreenshot` utility function
   - Implement helpers for masking dynamic content
   - Add utilities for managing baseline images

3. **Visual Test Cases**:
   - Authentication dialogs (sign in, sign up)
   - Error states and messages
   - Dashboard components
   - Lesson cards and previews
   - Payment flows

4. **CI Integration**:
   - Add visual testing step to CI workflow
   - Configure artifact storage for failed test diffs
   - Set up notification for visual regression failures

## Likely Affected Files

1. `e2e-tests/playwright.config.ts` - Add visual testing configuration
2. `e2e-tests/visual-testing.ts` - Create helper functions
3. `e2e-tests/auth-flows.visual.spec.ts` - Add visual tests for auth flows
4. `package.json` - Add scripts for running visual tests
5. `.github/workflows/e2e-tests.yml` - Update CI workflow

## Testing Requirements

- Verify visual tests detect actual UI changes
- Confirm tests don't produce false positives with dynamic content
- Test across different viewport sizes
- Verify baseline update process works correctly
- Ensure CI integration functions properly

## Environment

- **Browsers**: Chromium (primary for visual testing)
- **Viewport Sizes**: Desktop (1280x720), Tablet (768x1024), Mobile (375x667)
- **Theme**: Light mode (primary), Dark mode (secondary)

## Priority

Medium - Visual testing will significantly improve our ability to detect unintended UI changes, but functional testing remains the higher priority.

## Additional Context

- Visual tests are more sensitive to environment differences than functional tests
- We should start with a small set of critical components before expanding coverage
- Consider using Percy or other specialized visual testing services for more advanced needs
- Visual testing will be particularly valuable for our upcoming UI refresh
