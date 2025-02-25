import { Page, expect } from '@playwright/test';

/**
 * Compare a screenshot with the baseline
 * @param page Playwright page object
 * @param name Name of the screenshot (will be used as filename)
 * @param options Configuration options for the screenshot
 */
export async function compareScreenshot(
  page: Page, 
  name: string, 
  options?: { 
    fullPage?: boolean, 
    threshold?: number,
    mask?: Array<{ selector: string }>
  }
) {
  // Take a screenshot and compare it with the baseline
  await expect(page).toHaveScreenshot(`${name}.png`, {
    // Default options
    fullPage: options?.fullPage ?? false,
    // Threshold for pixel difference (0-1)
    threshold: options?.threshold ?? 0.2,
    // Elements to mask before comparison (like timestamps, random content)
    mask: options?.mask ?? [],
    // Maximum pixels that can be different
    maxDiffPixelRatio: 0.01
  });
}

/**
 * Get common selectors to mask in screenshots
 * These are elements that might change between test runs
 */
export function getMaskSelectors() {
  return [
    // Common dynamic elements that should be masked
    { selector: 'time' },
    { selector: '[data-testid="timestamp"]' },
    { selector: '[data-random]' },
    { selector: '.user-avatar' }, // User avatars might change
    { selector: '[data-testid="spinner-icon"]' }, // Loading spinners
    { selector: '[data-testid="spinner"]' }
  ];
}
