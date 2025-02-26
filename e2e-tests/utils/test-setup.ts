import { Page } from '@playwright/test';

/**
 * Setup mock responses for third-party services
 * 
 * @param page Playwright page object
 */
export async function setupMocks(page: Page) {
  // Mock Supabase authentication
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/token')) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'test-user-id',
            email: 'test-buyer@example.com',
            user_metadata: {
              full_name: 'Test User',
              avatar_url: 'https://example.com/avatar.png'
            },
            app_metadata: {
              provider: 'email',
              providers: ['email']
            }
          }
        })
      });
    } else {
      await route.continue();
    }
  });

  // Mock Stripe API responses
  await page.route('**/api/stripe/create-checkout-session', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: 'cs_test_mock',
        url: '/mock-checkout'
      })
    });
  });

  // Mock Mux API responses
  await page.route('**/api/mux/**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        data: {
          id: 'mock-video-id',
          playback_ids: [{ id: 'mock-playback-id' }]
        }
      })
    });
  });
}
