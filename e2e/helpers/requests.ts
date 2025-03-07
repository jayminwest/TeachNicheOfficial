import { Page } from '@playwright/test';

/**
 * Options for creating a mock lesson request
 */
export interface MockRequestOptions {
  id?: string;
  title?: string;
  description?: string;
  userId?: string;
  category?: string;
  status?: 'open' | 'in_progress' | 'completed';
  voteCount?: number;
  tags?: string[];
  instagramHandle?: string;
  createdAt?: string;
}

/**
 * Create a mock lesson request for testing
 * 
 * @param page - Playwright page object
 * @param options - Request configuration options
 * @returns The created mock request data
 */
export async function createMockRequest(page: Page, options: MockRequestOptions = {}) {
  // Set default options
  const defaults = {
    id: `request-${Date.now()}`,
    title: 'Test Lesson Request',
    description: 'This is a test lesson request for E2E testing.',
    userId: 'test-learner-id',
    category: 'test-category',
    status: 'open',
    voteCount: 0,
    tags: ['test'],
    instagramHandle: 'testuser',
    createdAt: new Date().toISOString(),
  };
  
  const requestData = { ...defaults, ...options };
  
  // Mock the request data in localStorage
  await page.evaluate((data) => {
    const mockRequests = JSON.parse(localStorage.getItem('mock-requests') || '[]');
    const existingIndex = mockRequests.findIndex((r: any) => r.id === data.id);
    
    if (existingIndex >= 0) {
      mockRequests[existingIndex] = data;
    } else {
      mockRequests.push(data);
    }
    
    localStorage.setItem('mock-requests', JSON.stringify(mockRequests));
  }, requestData);
  
  return requestData;
}

/**
 * Mock a vote on a lesson request
 * 
 * @param page - Playwright page object
 * @param requestId - ID of the request to vote on
 * @param userId - ID of the user voting
 * @param voteType - Type of vote ('up' or 'down')
 */
export async function mockRequestVote(
  page: Page, 
  requestId: string, 
  userId: string = 'test-learner-id',
  voteType: 'up' | 'down' = 'up'
) {
  await page.evaluate(({ requestId, userId, voteType }) => {
    // Update the request vote count
    const mockRequests = JSON.parse(localStorage.getItem('mock-requests') || '[]');
    const requestIndex = mockRequests.findIndex((r: any) => r.id === requestId);
    
    if (requestIndex >= 0) {
      // Check if user already voted
      const votes = JSON.parse(localStorage.getItem('mock-votes') || '[]');
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
      
      localStorage.setItem('mock-requests', JSON.stringify(mockRequests));
      localStorage.setItem('mock-votes', JSON.stringify(votes));
    }
  }, { requestId, userId, voteType });
}

/**
 * Clear all mock request data
 * 
 * @param page - Playwright page object
 */
export async function clearMockRequests(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('mock-requests');
    localStorage.removeItem('mock-votes');
  });
}
