import { test, expect } from '@playwright/test';

/**
 * Visual regression test for the homepage
 * These tests capture screenshots of key UI elements and compare them against baseline images
 * 
 * Note: When running for the first time or after UI changes, use:
 * npm run test:visual -- --update-snapshots
 */
test.describe('Homepage Visual Tests', () => {
  test('homepage visual appearance', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the hero section
    const heroSection = await page.locator('[data-testid="page-hero-container"]');
    await expect(heroSection).toBeVisible();
    
    // Add fixed dimensions to ensure consistent screenshots
    await page.evaluate(() => {
      const heroElement = document.querySelector('[data-testid="page-hero-container"]');
      if (heroElement) {
        heroElement.setAttribute('style', 'height: 664px; width: 1280px; overflow: hidden;');
      }
    });
    
    // Wait for any style changes to apply
    await page.waitForTimeout(500);
    
    await expect(heroSection).toHaveScreenshot('homepage-hero.png', {
      maxDiffPixelRatio: 0.2 // Allow for more pixel differences (20%)
    });
    
    // Take a screenshot of the features section
    const featuresSection = await page.locator('h2:has-text("Why Choose Teach Niche?")').first().locator('..').locator('..');
    await expect(featuresSection).toBeVisible();
    await expect(featuresSection).toHaveScreenshot('homepage-features.png');
    
    // Take a screenshot of the footer
    const footer = await page.locator('footer').first();
    await expect(footer).toBeVisible();
    await expect(footer).toHaveScreenshot('homepage-footer.png');
  });
});
