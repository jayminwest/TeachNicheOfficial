import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth-helpers';

test.describe('Earnings Dashboard', () => {
  test('displays earnings information for creators', async ({ page }) => {
    // Login as a creator
    await loginAsUser(page, 'test-creator@example.com', 'TestPassword123!');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify earnings widget is visible
    await expect(page.locator('[data-testid="earnings-widget"]')).toBeVisible();
    
    // Check that earnings sections are present
    await expect(page.getByText('Total Earnings')).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();
    await expect(page.getByText('Paid to Date')).toBeVisible();
    
    // Check that the tabs work
    await page.click('text=Upcoming Payout');
    await expect(page.getByText('Next Payout Date')).toBeVisible();
  });

  test('bank account setup form works correctly', async ({ page }) => {
    // Login as a creator
    await loginAsUser(page, 'test-creator@example.com', 'TestPassword123!');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Scroll to bank account form
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Fill in bank account details
    await page.fill('#accountHolderName', 'Test Creator');
    await page.click('#accountType');
    await page.click('text=Checking');
    await page.fill('#routingNumber', '110000000');
    await page.fill('#accountNumber', '000123456789');
    
    // Submit the form (but intercept the request to prevent actual submission)
    await page.route('/api/payouts/bank-account', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          message: 'Bank account set up successfully',
          last_four: '6789'
        })
      });
    });
    
    // Click the submit button
    await page.click('button:has-text("Set Up Bank Account")');
    
    // Verify success message appears
    await expect(page.getByText('Your bank account has been successfully set up for payouts')).toBeVisible();
  });
});
