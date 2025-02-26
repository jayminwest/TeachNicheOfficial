import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth-helpers';
import { setupMocks } from '../utils/test-setup';

test.describe('Earnings Dashboard', () => {
  test('displays earnings information for creators', async ({ page }) => {
    // Set up mocks first
    await setupMocks(page);
    
    // Mock earnings data API response
    await page.route('/api/earnings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalEarnings: 15000,
          pendingEarnings: 10000,
          paidEarnings: 5000,
          formattedTotal: '$150.00',
          formattedPending: '$100.00',
          formattedPaid: '$50.00',
          nextPayoutDate: '2025-03-01',
          nextPayoutAmount: 10000,
          formattedNextPayout: '$100.00',
          recentEarnings: [
            {
              id: '1',
              amount: 5000,
              formattedAmount: '$50.00',
              status: 'pending',
              createdAt: '2025-02-20T12:00:00Z',
              lessonTitle: 'Test Lesson 1',
              lessonId: 'lesson-1'
            }
          ]
        })
      });
    });
    
    // Login as a creator
    await loginAsUser(page, 'test-creator@example.com', 'TestPassword123!');
    
    // Navigate to earnings page
    await page.goto('/dashboard/earnings');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Verify earnings section is visible
    await expect(page.locator('[data-testid="earnings-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-earnings"]')).toBeVisible();
    
    // Debug: Log the current URL and page content
    console.log('Current URL:', page.url());
    
    // Wait longer for the earnings history to load and be visible
    await page.waitForSelector('[data-testid="earnings-history"]', { timeout: 15000 });
    
    // Verify earnings history is loaded
    await expect(page.locator('[data-testid="earnings-history"]')).toBeVisible({ timeout: 15000 });
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'earnings-dashboard.png' });
  });

  test('bank account setup form works correctly', async ({ page }) => {
    // Set up mocks first
    await setupMocks(page);
    
    // Login as a creator
    await loginAsUser(page, 'test-creator@example.com', 'TestPassword123!');
    
    // Navigate to earnings page
    await page.goto('/dashboard/earnings');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Debug: Log the current URL and page content
    console.log('Current URL:', page.url());
    
    // Wait longer for the bank account form to load and be visible
    await page.waitForSelector('[data-testid="bank-account-form"]', { timeout: 15000 });
    
    // Verify bank account form is visible
    const bankAccountForm = page.locator('[data-testid="bank-account-form"]');
    await expect(bankAccountForm).toBeVisible({ timeout: 15000 });
    
    // Fill bank account details
    await page.fill('#accountHolderName', 'Creator Name');
    await page.click('#accountType');
    await page.selectOption('#accountType', 'checking');
    await page.fill('#routingNumber', '110000000');
    await page.fill('#accountNumber', '000123456789');
    
    // Mock the API response for bank account setup
    await page.route('/api/payouts/bank-account', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    // Submit the form
    await page.click('button:has-text("Set Up Bank Account")');
    
    // Verify success message appears
    await expect(page.locator('[data-testid="bank-account-success"]')).toBeVisible({ timeout: 10000 });
  });
});
