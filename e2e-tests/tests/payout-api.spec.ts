import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth-helpers';

test.describe('Payout API Endpoints', () => {
  test('bank account API endpoint works correctly', async ({ request, page }) => {
    // Login to get authentication token
    await loginAsUser(page, 'test-creator@example.com', 'TestPassword123!');
    
    // Get the session token
    const sessionData = await page.evaluate(async () => {
      const { data } = await window.supabase.auth.getSession();
      return data;
    });
    
    // Make API request to set up bank account
    const response = await request.post('/api/payouts/bank-account', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`
      },
      data: {
        userId: sessionData.session.user.id,
        accountNumber: '000123456789',
        routingNumber: '110000000',
        accountHolderName: 'API Test Creator',
        accountType: 'checking',
        country: 'US'
      }
    });
    
    // Verify response
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBeTruthy();
  });
  
  test('earnings API endpoint returns correct data', async ({ request, page }) => {
    // Login to get authentication token
    await loginAsUser(page, 'test-creator@example.com', 'TestPassword123!');
    
    // Get the session token
    const sessionData = await page.evaluate(async () => {
      const { data } = await window.supabase.auth.getSession();
      return data;
    });
    
    // Make API request to get earnings
    const response = await request.get('/api/earnings', {
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`
      }
    });
    
    // Verify response
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('earnings');
    expect(Array.isArray(responseData.earnings)).toBeTruthy();
    
    // Verify earnings structure
    if (responseData.earnings.length > 0) {
      const firstEarning = responseData.earnings[0];
      expect(firstEarning).toHaveProperty('amount');
      expect(firstEarning).toHaveProperty('status');
      expect(firstEarning).toHaveProperty('created_at');
    }
  });
  
  test('unauthorized access to earnings API is rejected', async ({ request }) => {
    // Make API request without authentication
    const response = await request.get('/api/earnings');
    
    // Verify response
    expect(response.status()).toBe(401);
  });
});
