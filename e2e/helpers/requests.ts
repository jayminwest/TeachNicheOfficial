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
  created_at?: string;
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
/**
 * Creates a mock lesson request in the test environment
 * 
 * @param page - Playwright page object
 * @param options - Configuration options for the mock request
 * @returns The created mock request data
 */
export async function createMockRequest(page, options = {}) {
  // Set default options
  const defaults = {
    id: `request-${Date.now()}`,
    title: 'Test Lesson Request',
    description: 'This is a test lesson request created for E2E testing',
    userId: 'test-user-id',
    category: 'Beginner Tricks',
    status: 'open',
    voteCount: 0,
    tags: ['beginner', 'test'],
    instagramHandle: 'testuser',
    created_at: new Date().toISOString()
  };
  
  const mockRequest = { ...defaults, ...options };
  
  // Mock the request data in localStorage for testing
  await page.evaluate((request) => {
    // Store the mock request in localStorage
    const existingRequests = JSON.parse(localStorage.getItem('mock-requests') || '[]');
    existingRequests.push(request);
    localStorage.setItem('mock-requests', JSON.stringify(existingRequests));
    
    // Also store a mapping of request IDs to user IDs for access control testing
    const requestUserMap = JSON.parse(localStorage.getItem('request-user-map') || '{}');
    requestUserMap[request.id] = request.userId;
    localStorage.setItem('request-user-map', JSON.stringify(requestUserMap));
  }, mockRequest);
  
  return mockRequest;
}

/**
 * Mocks a vote on a lesson request
 * 
 * @param page - Playwright page object
 * @param requestId - ID of the request
 * @param userId - ID of the user voting
 * @param voteType - Type of vote ('up' or 'down')
 */
export async function mockRequestVote(page, requestId, userId, voteType) {
  await page.evaluate(({ request, user, type }) => {
    // Get existing votes
    const votes = JSON.parse(localStorage.getItem('mock-request-votes') || '[]');
    
    // Check if user already voted
    const existingVoteIndex = votes.findIndex(v => v.requestId === request && v.userId === user);
    
    if (existingVoteIndex >= 0) {
      // Update existing vote
      const existingVote = votes[existingVoteIndex];
      
      // If same vote type, remove the vote (toggle off)
      if (existingVote.voteType === type) {
        votes.splice(existingVoteIndex, 1);
      } else {
        // Change vote type
        votes[existingVoteIndex].voteType = type;
      }
    } else {
      // Add new vote
      votes.push({
        id: `vote-${Date.now()}`,
        requestId: request,
        userId: user,
        voteType: type,
        created_at: new Date().toISOString()
      });
    }
    
    localStorage.setItem('mock-request-votes', JSON.stringify(votes));
    
    // Update request vote count
    const requests = JSON.parse(localStorage.getItem('mock-requests') || '[]');
    const requestIndex = requests.findIndex(r => r.id === request);
    
    if (requestIndex >= 0) {
      // Calculate new vote count
      const upvotes = votes.filter(v => v.requestId === request && v.voteType === 'up').length;
      const downvotes = votes.filter(v => v.requestId === request && v.voteType === 'down').length;
      requests[requestIndex].voteCount = upvotes - downvotes;
      
      localStorage.setItem('mock-requests', JSON.stringify(requests));
    }
  }, { request: requestId, user: userId, type: voteType });
}

/**
 * Updates the status of a lesson request
 * 
 * @param page - Playwright page object
 * @param requestId - ID of the request
 * @param newStatus - New status for the request
 */
export async function updateRequestStatus(page, requestId, newStatus) {
  await page.evaluate(({ request, status }) => {
    const requests = JSON.parse(localStorage.getItem('mock-requests') || '[]');
    const requestIndex = requests.findIndex(r => r.id === request);
    
    if (requestIndex >= 0) {
      requests[requestIndex].status = status;
      localStorage.setItem('mock-requests', JSON.stringify(requests));
    }
  }, { request: requestId, status: newStatus });
}
