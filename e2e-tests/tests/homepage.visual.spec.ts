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
    await page.goto('http://localhost:3001/');
    
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
    await page.goto('http://localhost:3001/');
    
    // Wait for any content to be visible
    await page.waitForSelector('h1, .hero, header', { state: 'visible', timeout: 5000 }).catch(() => {
      console.log('No specific hero selectors found, continuing with main content');
    });
    
    // Wait for images to load
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the top portion of the page instead of trying to find a specific hero section
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // Capture the top portion of the page
    await expect(page).toHaveScreenshot('homepage-hero.png', {
      clip: { x: 0, y: 0, width: 1280, height: 600 },
      maxDiffPixelRatio: 0.01,
    });
  });
  
  test('should match navigation menu screenshot', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3001/');
    
    // Take a screenshot of the main navigation menu using a more specific selector
    // Use aria-label to target the specific nav element
    const navMenu = page.locator('nav[aria-label="Main"]');
    await expect(navMenu).toHaveScreenshot('homepage-nav.png');
  });
  
  test('should match mobile menu screenshot', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the homepage
    await page.goto('http://localhost:3001/');
    
    // Open the mobile menu if it's not visible by default
    const menuButton = page.locator('button[aria-label="Toggle menu"], button.hamburger-menu');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Wait for any animations to complete
      await page.waitForTimeout(500);
    }
    
    // Wait for menu to be fully rendered
    await page.waitForSelector('nav[role="navigation"], .mobile-menu', { state: 'visible', timeout: 2000 }).catch(() => {
      console.log('Mobile menu selector not found, continuing with screenshot');
    });
    
    // Take a screenshot of the mobile menu with more tolerance for differences
    await expect(page).toHaveScreenshot('homepage-mobile-menu.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
  
  test('should match dark mode screenshot', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3001/');
    
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    
    // Wait for theme change to apply
    await page.waitForTimeout(500);
    
    // Wait for all content to be visible
    await page.waitForSelector('section:first-of-type', { state: 'visible', timeout: 2000 }).catch(() => {
      console.log('Hero section not found, continuing with screenshot');
    });
    
    // Take a screenshot in dark mode with more tolerance for differences
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
