import { test, expect } from '@playwright/test';
import { loginAsUser } from './utils/auth-helpers';
import { setupMocks } from './utils/test-setup';

test.describe('Lesson purchase flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up all mocks before any test runs
    await setupMocks(page);
    
    // Log in before each test with improved helper
    try {
      await loginAsUser(page, 'test-buyer@example.com', 'TestPassword123!');
    } catch (error) {
      console.error('Login failed:', error);
      // Take a screenshot for debugging
      await page.screenshot({ path: `debug-login-error-${Date.now()}.png` });
      throw error;
    }
  });

  test('User can browse and preview lessons', async ({ page }) => {
    // Navigate to lessons page
    await page.goto('/lessons');
    
    // Verify lessons are displayed
    await expect(page.locator('[data-testid="lesson-grid"]')).toBeVisible();
    // Check that there's at least one lesson card
    const lessonCards = await page.locator('[data-testid="lesson-card"]').count();
    expect(lessonCards).toBeGreaterThan(0);
    
    // Click on a lesson card
    await page.click('[data-testid="lesson-card"]:first-child');
    
    // Verify preview dialog opens
    await expect(page.locator('[data-testid="lesson-preview-dialog"]')).toBeVisible();
    
    // Verify lesson details are displayed
    await expect(page.locator('[data-testid="lesson-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-price"]')).toBeVisible();
  });

  test('User can purchase a lesson', async ({ page }) => {
    // Navigate to lessons page
    await page.goto('/lessons');
    
    // Click on a lesson card
    await page.click('[data-testid="lesson-card"]:first-child');
    
    // Get the lesson title for later verification
    const lessonTitle = await page.locator('[data-testid="lesson-title"]').textContent();
    
    // Click purchase button
    await page.click('[data-testid="purchase-button"]');
    
    // We should use the setupMocks function from test-setup.ts instead of creating routes here
    // The mock for Stripe checkout is already set up in setupMocks
    
    // Handle mock checkout page
    await page.waitForURL('**/mock-checkout');
    await page.click('[data-testid="complete-purchase"]');
    
    // Verify redirect to success page
    await page.waitForURL('**/success**');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Navigate to my lessons page to verify purchase
    await page.goto('/my-lessons');
    
    // Verify the purchased lesson appears in my lessons
    await expect(page.locator(`[data-testid="lesson-title"]:has-text("${lessonTitle}")`)).toBeVisible();
  });

  test('User can watch purchased lesson', async ({ page }) => {
    // Navigate to my lessons page
    await page.goto('/my-lessons');
    
    // Click on a purchased lesson
    await page.click('[data-testid="lesson-card"]:first-child');
    
    // Verify video player is visible
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
    
    // Click play button
    await page.click('[data-testid="play-button"]');
    
    // Verify video is playing (this is a simplified check)
    await expect(async () => {
      const isPlaying = await page.evaluate(() => {
        const video = document.querySelector('video');
        return video && !video.paused && video.currentTime > 0;
      });
      expect(isPlaying).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });
});
