import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Lesson purchase flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test using our helper
    await login(page, 'test-buyer@example.com', 'TestPassword123!');
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
});
