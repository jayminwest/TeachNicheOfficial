import { Page } from '@playwright/test';

/**
 * Set up API route interception to mock responses
 * 
 * @param page - Playwright page object
 */
export async function setupApiInterceptors(page: Page) {
  // Add a global route handler for all API calls to ensure we catch everything
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    console.log(`Intercepting API call to: ${url}`);
    
    // Get user data from localStorage
    const userData = await page.evaluate(() => {
      const sessionData = localStorage.getItem('supabase.auth.token');
      if (!sessionData) return null;
      
      try {
        const parsed = JSON.parse(sessionData);
        return parsed.currentSession?.user || null;
      } catch {
        return null;
      }
    });

    // Add a small delay to ensure localStorage is properly set
    await page.waitForTimeout(100);
    
    // Handle auth endpoints
    if (url.includes('/api/auth')) {
      if (url.includes('/api/auth/session')) {
        if (userData) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ 
              user: userData, 
              session: { 
                user: userData,
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
                expires_at: Date.now() + 3600 * 1000
              },
              redirect: new URL(url).searchParams.get('redirect') || null
            }),
          });
        } else {
          await route.fulfill({
            status: 401,
            body: JSON.stringify({ error: 'Not authenticated' }),
          });
        }
      } else if (url.includes('/api/auth/signin')) {
        // Mock successful sign-in response
        const postData = route.request().postDataJSON();
        const email = postData?.email || 'test@example.com';
        
        // Create mock user data
        const mockUser = {
          id: email === 'learner@example.com' ? 'test-learner-id' : 
               email === 'creator@example.com' ? 'test-creator-id' : 'test-user-id',
          email: email,
          user_metadata: {
            full_name: email === 'learner@example.com' ? 'Test Learner' : 
                       email === 'creator@example.com' ? 'Test Creator' : 'Test User',
          }
        };
        
        // Store in localStorage for future requests
        await page.evaluate((user) => {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            currentSession: {
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_at: Date.now() + 3600 * 1000,
              user: user
            },
            expiresAt: Date.now() + 3600 * 1000,
          }));
          
          // Also set profile data
          localStorage.setItem('user-profile', JSON.stringify({
            id: user.id,
            full_name: user.user_metadata.full_name,
            email: user.email,
            avatar_url: 'https://example.com/avatar.png',
          }));
        }, mockUser);
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            user: mockUser, 
            session: { 
              user: mockUser,
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_at: Date.now() + 3600 * 1000
            } 
          }),
        });
      } else {
        // Continue with the request for other auth endpoints
        await route.continue();
      }
      return;
    }
    
    // Handle profile endpoints
    if (url.includes('/api/profile')) {
      const profile = await page.evaluate(() => {
        const profileData = localStorage.getItem('user-profile');
        return profileData ? JSON.parse(profileData) : null;
      });
      
      if (profile) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify(profile),
        });
      } else {
        await route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Profile not found' }),
        });
      }
      return;
    }
    
    // Handle lessons endpoints
    if (url.includes('/api/lessons')) {
      // Get mock lessons from localStorage
      const mockLessons = await page.evaluate(() => {
        const lessonsData = localStorage.getItem('mock-lessons');
        return lessonsData ? JSON.parse(lessonsData) : [];
      });
      
      if (url.includes('/api/lessons/check-purchase')) {
        const urlObj = new URL(url);
        const lessonId = urlObj.searchParams.get('lessonId');
        
        const purchasedLessons = await page.evaluate(() => {
          const data = localStorage.getItem('purchased-lessons');
          return data ? JSON.parse(data) : [];
        });
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            hasAccess: purchasedLessons.includes(lessonId),
            lessonId 
          }),
        });
      } else if (url.match(/\/api\/lessons\/[^\/]+$/)) {
        // Single lesson endpoint
        const lessonId = url.split('/').pop();
        const lesson = mockLessons.find((l: any) => l.id === lessonId);
        
        if (lesson) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify(lesson),
          });
        } else {
          await route.fulfill({
            status: 404,
            body: JSON.stringify({ error: 'Lesson not found' }),
          });
        }
      } else if (url.includes('/api/lessons')) {
        // All lessons endpoint
        await route.fulfill({
          status: 200,
          body: JSON.stringify(mockLessons),
        });
      }
      return;
    }
    
    // Handle requests endpoints
    if (url.includes('/api/requests')) {
      // Get mock requests from localStorage
      const mockRequests = await page.evaluate(() => {
        const requestsData = localStorage.getItem('mock-requests');
        return requestsData ? JSON.parse(requestsData) : [];
      });
      
      if (url.includes('/api/requests/vote')) {
        // Handle vote request
        const postData = route.request().postDataJSON();
        
        await page.evaluate((data) => {
          mockRequestVote(window, data.requestId, data.userId, data.voteType);
        }, postData);
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      } else if (url.match(/\/api\/requests\/[^\/]+$/)) {
        // Single request endpoint
        const requestId = url.split('/').pop();
        const request = mockRequests.find((r: any) => r.id === requestId);
        
        if (request) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify(request),
          });
        } else {
          await route.fulfill({
            status: 404,
            body: JSON.stringify({ error: 'Request not found' }),
          });
        }
      } else if (url.includes('/api/requests')) {
        // All requests endpoint
        await route.fulfill({
          status: 200,
          body: JSON.stringify(mockRequests),
        });
      }
      return;
    }
    
    // Handle Stripe endpoints
    if (url.includes('/api/stripe')) {
      if (url.includes('/api/stripe/create-checkout-session')) {
        const postData = route.request().postDataJSON();
        const sessionId = `cs_test_${Date.now()}`;
        
        // Store checkout session
        await page.evaluate((data) => {
          const mockSessions = JSON.parse(localStorage.getItem('mock-stripe-sessions') || '{}');
          mockSessions[data.sessionId] = {
            id: data.sessionId,
            lessonId: data.lessonId,
            price: data.price,
            created: Date.now(),
          };
          localStorage.setItem('mock-stripe-sessions', JSON.stringify(mockSessions));
        }, { sessionId, ...postData });
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            sessionId,
            url: `http://localhost:3000/checkout/success?session_id=${sessionId}` 
          }),
        });
      } else if (url.includes('/api/stripe/connect-account')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            accountId: 'acct_test123456',
            url: 'http://localhost:3000/creator/onboarding?success=true' 
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      }
      return;
    }
    
    // Default handler for any other API routes
    console.log(`No specific handler for ${url}, continuing with request`);
    await route.continue();
  });
}

/**
 * Helper function to mock request vote - this is defined here to avoid circular imports
 * but is called from the page.evaluate context
 */
function mockRequestVote(
  window: any,
  requestId: string, 
  userId: string = 'test-learner-id',
  voteType: 'up' | 'down' = 'up'
) {
  // Update the request vote count
  const mockRequests = JSON.parse(window.localStorage.getItem('mock-requests') || '[]');
  const requestIndex = mockRequests.findIndex((r: any) => r.id === requestId);
  
  if (requestIndex >= 0) {
    // Check if user already voted
    const votes = JSON.parse(window.localStorage.getItem('mock-votes') || '[]');
    const existingVoteIndex = votes.findIndex(
      (v: any) => v.requestId === requestId && v.userId === userId
    );
    
    if (existingVoteIndex >= 0) {
      const existingVote = votes[existingVoteIndex];
      // If changing vote type, adjust count accordingly
      if (existingVote.voteType !== voteType) {
        mockRequests[requestIndex].voteCount += voteType === 'up' ? 2 : -2;
        votes[existingVoteIndex].voteType = voteType;
      }
    } else {
      // New vote
      mockRequests[requestIndex].voteCount += voteType === 'up' ? 1 : -1;
      votes.push({
        id: `vote-${Date.now()}`,
        requestId,
        userId,
        voteType,
        createdAt: new Date().toISOString(),
      });
    }
    
    window.localStorage.setItem('mock-requests', JSON.stringify(mockRequests));
    window.localStorage.setItem('mock-votes', JSON.stringify(votes));
  }
}
