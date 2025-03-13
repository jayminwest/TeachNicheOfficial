// Mock next/server before any other imports
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => body
    })
  }
}));

// Set up test environment
import { POST } from '../requests/vote/route';

// Mock fetch globally
global.fetch = jest.fn();

describe('Vote Redirect API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects requests to the /api/votes endpoint', async () => {
    // Mock successful response from the new endpoint
    const mockResponse = {
      success: true,
      currentVotes: 5,
      userHasVoted: true
    };
    
    // Setup fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => mockResponse
    });

    // Create a request to the deprecated endpoint
    const request = new Request('http://localhost/api/requests/vote', {
      method: 'POST',
      body: JSON.stringify({
        requestId: 'request-123',
        voteType: 'upvote'
      })
    });
    
    // Call the deprecated endpoint
    const response = await POST(request);
    
    // Verify the request was forwarded to the new endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/api/votes')
      })
    );
    
    // Verify the response from the new endpoint is returned
    expect(await response.json()).toEqual(mockResponse);
  });

  it('handles errors during redirection', async () => {
    // Setup fetch mock to throw an error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Create a request to the deprecated endpoint
    const request = new Request('http://localhost/api/requests/vote', {
      method: 'POST',
      body: JSON.stringify({
        requestId: 'request-123',
        voteType: 'upvote'
      })
    });
    
    // Call the deprecated endpoint
    const response = await POST(request);
    
    // Verify error response
    expect(response.status).toBe(500);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error', 'redirect_failed');
    expect(responseData.success).toBe(false);
  });
});
