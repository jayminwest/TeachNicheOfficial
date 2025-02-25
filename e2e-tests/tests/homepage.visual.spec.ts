import { test, expect } from '@playwright/test';

/**
 * Visual regression test for the homepage
 * These tests capture screenshots of key UI elements and compare them against baseline images
 */
test.describe('Homepage Visual Tests', () => {
  test('homepage visual appearance', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for any animations to complete
    await page.waitForTimeout(500);
    
    // Take a screenshot of the hero section
    const heroSection = await page.locator('.relative.h-\\[400px\\]').first();
    await expect(heroSection).toBeVisible();
    await expect(heroSection).toHaveScreenshot('homepage-hero.png');
    
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
