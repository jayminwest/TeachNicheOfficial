import { test, expect } from '@playwright/test';

/**
 * Visual regression test for the homepage
 * These tests capture screenshots of key UI elements and compare them against baseline images
 * 
 * Note: When running for the first time or after UI changes, use:
 * npx playwright test --update-snapshots
 */
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
    // Use a more reliable selector with data-testid
    await page.waitForSelector('[data-testid="hero-section"]', { state: 'visible' });
    
    // Take a screenshot of just the hero section
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toHaveScreenshot('homepage-hero.png', {
      // More strict threshold for critical UI elements
      maxDiffPixelRatio: 0.005,
    });
  });
  
  test('should match navigation menu screenshot', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Take a screenshot of the main navigation menu using a more specific selector
    // Use aria-label to target the specific nav element
    const navMenu = page.locator('nav[aria-label="Main"]');
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
    
    // Wait for menu to be fully rendered
    await page.waitForSelector('[data-testid="mobile-menu"]', { state: 'visible', timeout: 2000 }).catch(() => {
      console.log('Mobile menu selector not found, continuing with screenshot');
    });
    
    // Take a screenshot of the mobile menu with more tolerance for differences
    await expect(page).toHaveScreenshot('homepage-mobile-menu.png', {
      maxDiffPixelRatio: 0.02,
    });
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
    
    // Wait for all content to be visible
    await page.waitForSelector('[data-testid="hero-section"]', { state: 'visible', timeout: 2000 }).catch(() => {
      console.log('Hero section not found, continuing with screenshot');
    });
    
    // Take a screenshot in dark mode with more tolerance for differences
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
