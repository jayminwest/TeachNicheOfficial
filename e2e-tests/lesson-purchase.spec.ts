import { test, expect } from '@playwright/test';

// Helper function to log in
async function login(page: any) {
  await page.goto('/');
  await page.click('[data-testid="sign-in-button"]');
  await page.fill('[data-testid="email-input"]', 'test-buyer@example.com');
  await page.fill('[data-testid="password-input"]', 'TestPassword123!');
  await page.click('[data-testid="submit-sign-in"]');
  await page.waitForSelector('[data-testid="user-avatar"]');
  
  // Ensure the session is properly established for RLS
  await page.waitForTimeout(1000);
}

test.describe('Lesson purchase flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await login(page);
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
    
    // Mock Stripe checkout for testing
    // In a real test, you might use Stripe test mode
    await page.route('**/api/stripe/create-checkout-session', route => {
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          id: 'mock_session_id',
          url: '/mock-checkout' 
        })
      });
    });
    
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
