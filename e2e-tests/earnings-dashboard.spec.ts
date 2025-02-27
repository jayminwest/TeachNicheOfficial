import { test, expect } from '@playwright/test';
import { loginAsUser } from './utils/auth-helpers';

test.describe('Earnings Dashboard', () => {
  test('should navigate to earnings dashboard from main dashboard', async ({ page }) => {
    // Login as a creator
    await loginAsUser(page, 'creator@example.com', 'password123');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Find and click the earnings link
    const earningsLink = page.locator('[data-testid="earnings-dashboard-link"]');
    await expect(earningsLink).toBeVisible();
    await earningsLink.click();
    
    // Verify we're on the earnings page
    await expect(page).toHaveURL('/dashboard/earnings');
    await expect(page.locator('h1')).toContainText('Earnings & Payouts');
    
    // Verify back to dashboard link works
    const backLink = page.locator('[data-testid="back-to-dashboard"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    
    // Verify we're back on the dashboard
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should display earnings summary and payout information', async ({ page }) => {
    // Login as a creator
    await loginAsUser(page, 'creator@example.com', 'password123');
    
    // Go directly to earnings page
    await page.goto('/dashboard/earnings');
    
    // Verify earnings summary is visible
    await expect(page.locator('[data-testid="earnings-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-earnings"]')).toBeVisible();
    
    // Switch to payouts tab
    await page.click('text=Payouts');
    
    // Verify payout history is visible
    await expect(page.locator('text=Payout History')).toBeVisible();
    
    // Verify payout information card is visible
    await expect(page.locator('text=Payout Information')).toBeVisible();
    await expect(page.locator('text=Revenue Share')).toBeVisible();
    await expect(page.locator('text=85%')).toBeVisible();
  });
  
  test('should show bank account form', async ({ page }) => {
    // Login as a creator
    await loginAsUser(page, 'creator@example.com', 'password123');
    
    // Go to earnings page
    await page.goto('/dashboard/earnings');
    
    // Verify bank account form is visible
    await expect(page.locator('form')).toBeVisible();
    
    // Verify form has expected fields (this will depend on your actual implementation)
    // This is a basic check - adjust based on your actual form fields
    await expect(page.locator('button:has-text("Connect Bank Account")')).toBeVisible();
  });
});
