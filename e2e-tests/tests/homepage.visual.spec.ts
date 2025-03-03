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
    const heroSection = await page.locator('[data-testid="hero-section-container"]');
    await expect(heroSection).toBeVisible();
    
    // Add a fixed height to ensure consistent screenshots
    await page.evaluate(() => {
      const heroElement = document.querySelector('[data-testid="hero-section-container"]');
      if (heroElement) {
        heroElement.setAttribute('style', 'min-height: 600px;');
      }
    });
    
    // Wait for any style changes to apply
    await page.waitForTimeout(500);
    
    await expect(heroSection).toHaveScreenshot('homepage-hero.png', {
      maxDiffPixelRatio: 0.1 // Allow for some pixel differences (10%)
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
import { test, expect } from '@playwright/test';

test.describe('Homepage Visual Regression', () => {
  test('should match homepage screenshot', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for all animations to complete
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the entire page
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      // More strict threshold for homepage
      maxDiffPixelRatio: 0.01,
    });
  });
  
  test('should match hero section screenshot', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for the hero section to be visible
    await page.waitForSelector('section.hero', { state: 'visible' });
    
    // Take a screenshot of just the hero section
    const heroSection = page.locator('section.hero');
    await expect(heroSection).toHaveScreenshot('homepage-hero.png', {
      // More strict threshold for critical UI elements
      maxDiffPixelRatio: 0.005,
    });
  });
  
  test('should match navigation menu screenshot', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Take a screenshot of the navigation menu
    const navMenu = page.locator('nav');
    await expect(navMenu).toHaveScreenshot('homepage-nav.png');
  });
  
  test('should match mobile menu screenshot', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the homepage
    await page.goto('/');
    
    // Open the mobile menu if it's not visible by default
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Wait for any animations to complete
      await page.waitForTimeout(500);
    }
    
    // Take a screenshot of the mobile menu
    await expect(page).toHaveScreenshot('homepage-mobile-menu.png');
  });
  
  test('should match dark mode screenshot', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    
    // Wait for theme change to apply
    await page.waitForTimeout(500);
    
    // Take a screenshot in dark mode
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
    });
  });
});
