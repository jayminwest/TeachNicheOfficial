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
    
    // Debug: Print form content to console
    const formContent = await bankAccountForm.innerHTML();
    console.log('Bank account form content:', formContent);
    
    // Inject test user data into the page to ensure the form is fully rendered
    await page.evaluate(() => {
      // Create a mock user object in the window
      window.mockUser = {
        id: 'test-user-id',
        email: 'test-creator@example.com',
        user_metadata: {
          full_name: 'Test Creator',
          avatar_url: 'https://example.com/avatar.png'
        }
      };
      
      // Dispatch an event that our auth context might listen for
      window.dispatchEvent(new CustomEvent('mock-auth-update', { detail: window.mockUser }));
      
      // Force re-render if needed
      if (document.querySelector('[data-testid="bank-account-form"]')) {
        document.querySelector('[data-testid="bank-account-form"]').setAttribute('data-test-ready', 'true');
      }
    });
    
    // Mock the API response for bank account setup before interacting with the form
    await page.route('/api/payouts/bank-account', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    // Wait for account holder name input to be available
    await page.waitForSelector('#accountHolderName', { timeout: 5000 });
    
    // Use simpler selectors with retry logic
    try {
      await page.fill('#accountHolderName', 'Creator Name');
      await page.selectOption('#accountType', 'checking');
      await page.fill('#routingNumber', '110000000');
      await page.fill('#accountNumber', '000123456789');
    } catch (e) {
      console.log('Retrying form interaction after error:', e);
      // If first attempt fails, try again after a short delay
      await page.waitForTimeout(1000);
      await page.fill('#accountHolderName', 'Creator Name');
      await page.selectOption('#accountType', 'checking');
      await page.fill('#routingNumber', '110000000');
      await page.fill('#accountNumber', '000123456789');
    }
    
    // Submit the form
    await page.click('button[data-testid="submit-bank-account"]');
    
    // Verify success message appears (try both the body element and the in-form message)
    try {
      await expect(page.locator('[data-testid="bank-account-success"]')).toBeVisible({ timeout: 5000 });
    } catch (e) {
      // If the first success indicator isn't found, try the in-form success message
      await expect(page.locator('[data-testid="form-success-message"]')).toBeVisible({ timeout: 5000 });
    }
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'bank-account-form-success.png' });
  });
});
