import { test, expect } from '@playwright/test';

// Helper function to login as a user
async function loginAsUser(page, email, password) {
  await page.goto('/');
  await page.click('[data-testid="sign-in-button"]');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="submit-sign-in"]');
  await page.waitForSelector('[data-testid="user-avatar"]');
}

test.describe('Payment and Payout System', () => {
  test('user can purchase a lesson with new payment system', async ({ page }) => {
    // Login as a user
    await loginAsUser(page, 'test-buyer@example.com', 'TestPassword123!');
    
    // Navigate to a lesson page
    await page.goto('/lessons/lesson-1');
    
    // Verify lesson details are visible
    await expect(page.locator('h1.lesson-title')).toBeVisible();
    
    // Click purchase button
    await page.click('[data-testid="purchase-button"]');
    
    // Fill payment details in Stripe iframe
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    
    // Complete purchase
    await page.click('[data-testid="confirm-payment"]');
    
    // Verify success and access to content
    await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
    
    // Verify purchase appears in user's purchases
    await page.goto('/dashboard/purchases');
    await expect(page.locator('.purchase-item')).toContainText(await page.locator('h1.lesson-title').textContent());
  });
  
  test('creator can set up bank account for payouts', async ({ page }) => {
    // Login as a creator
    await loginAsUser(page, 'test-creator@example.com', 'TestPassword123!');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify bank account form is visible
    await expect(page.locator('form')).toBeVisible();
    
    // Fill bank account details
    await page.fill('[id="accountHolderName"]', 'Creator Name');
    await page.click('[id="accountType"]');
    await page.click('text=Checking');
    await page.fill('[id="routingNumber"]', '110000000');
    await page.fill('[id="accountNumber"]', '000123456789');
    
    // Submit the form
    await page.click('button:has-text("Set Up Bank Account")');
    
    // Verify success message
    await expect(page.locator('text=Your bank account has been successfully set up for payouts')).toBeVisible();
  });
  
  test('creator can view earnings from purchases', async ({ page }) => {
    // First, make a purchase as a buyer
    await loginAsUser(page, 'test-buyer@example.com', 'TestPassword123!');
    await page.goto('/lessons/lesson-2');
    await page.click('[data-testid="purchase-button"]');
    
    // Fill payment details in Stripe iframe
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    
    // Complete purchase
    await page.click('[data-testid="confirm-payment"]');
    await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible();
    
    // Now login as the creator
    await loginAsUser(page, 'test-creator@example.com', 'TestPassword123!');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify earnings are displayed
    await expect(page.locator('[data-testid="earnings-widget"]')).toBeVisible();
    
    // Check that the recent purchase appears in earnings
    await expect(page.locator('[data-testid="earnings-widget"]')).toContainText('Lesson 2');
  });
});
