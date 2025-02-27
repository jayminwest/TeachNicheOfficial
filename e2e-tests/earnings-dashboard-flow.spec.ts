import { test, expect } from '@playwright/test';
import { loginAsUser } from './utils/auth-helpers';

test.describe('Earnings Dashboard Flow', () => {
  test('complete earnings dashboard user journey', async ({ page }) => {
    // Login as a creator with earnings
    await loginAsUser(page, 'creator-with-earnings@example.com', 'password123');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify earnings widget is visible
    await expect(page.locator('[data-testid="earnings-widget"]')).toBeVisible();
    
    // Click on earnings link
    await page.click('[data-testid="earnings-dashboard-link"]');
    
    // Verify we're on the earnings page
    await expect(page).toHaveURL('/dashboard/earnings');
    
    // Check earnings tab content
    await expect(page.locator('[data-testid="earnings-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-earnings"]')).toBeVisible();
    
    // Switch to payouts tab
    await page.click('text=Payouts');
    
    // Verify payout history is visible
    await expect(page.locator('text=Payout History')).toBeVisible();
    
    // Check bank account section
    const hasBankAccount = await page.locator('text=Your bank account is connected').isVisible();
    
    if (!hasBankAccount) {
      // Test connecting a bank account
      await page.click('button:has-text("Connect Bank Account")');
      
      // Fill in bank account details (this will depend on your implementation)
      // This is a simplified example - adjust based on your actual form
      await page.fill('[data-testid="account-holder-name"]', 'Test Creator');
      await page.fill('[data-testid="account-number"]', '000123456789');
      await page.fill('[data-testid="routing-number"]', '110000000');
      
      // Submit the form
      await page.click('button:has-text("Save Bank Details")');
      
      // Verify success message
      await expect(page.locator('text=Bank account connected successfully')).toBeVisible();
    } else {
      // Verify bank account information is displayed
      await expect(page.locator('text=Bank account ending in')).toBeVisible();
    }
    
    // Check payout information section
    await expect(page.locator('text=Payout Information')).toBeVisible();
    await expect(page.locator('text=Revenue Share')).toBeVisible();
    await expect(page.locator('text=85%')).toBeVisible();
    
    // Click on "Learn more" link
    await page.click('text=Learn more');
    
    // Verify we're on the help page
    await expect(page).toHaveURL('/help/creator-payouts');
    
    // Go back to earnings page
    await page.goBack();
    
    // Click back to dashboard
    await page.click('[data-testid="back-to-dashboard"]');
    
    // Verify we're back on the dashboard
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('earnings dashboard accessibility', async ({ page }) => {
    // Login as a creator
    await loginAsUser(page, 'creator@example.com', 'password123');
    
    // Navigate to earnings page
    await page.goto('/dashboard/earnings');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="back-to-dashboard"]:focus-visible')).toBeVisible();
    
    // Tab to the earnings tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('[role="tab"]:focus-visible')).toContainText('Earnings');
    
    // Activate the tab with keyboard
    await page.keyboard.press('Space');
    await expect(page.locator('[data-testid="earnings-summary"]')).toBeVisible();
    
    // Tab to the payouts tab
    await page.keyboard.press('Tab');
    await expect(page.locator('[role="tab"]:focus-visible')).toContainText('Payouts');
    
    // Activate the payouts tab
    await page.keyboard.press('Space');
    await expect(page.locator('text=Payout History')).toBeVisible();
    
    // Run automated accessibility tests
    // Note: This requires the @axe-core/playwright package
    // const violations = await new AxeBuilder({ page }).analyze();
    // expect(violations.length).toBe(0);
  });
});
