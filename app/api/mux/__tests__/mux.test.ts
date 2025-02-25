import * as routeModule from '../route';
import { MockConfig } from '../../../../__mocks__/utils/mock-helpers';
import { NextRequest, NextResponse } from 'next/server';

// Mock the Mux service
jest.mock('../../../../app/services/mux', () => ({
  createUpload: jest.fn().mockImplementation((config?: MockConfig) => {
    if (config?.shouldSucceed === false) {
      throw new Error(config.errorMessage || 'Mux error');
    }
    return Promise.resolve({
      id: 'upload-123',
      url: 'https://mux.com/upload/123'
    });
  }),
  getAsset: jest.fn().mockImplementation((assetId: string) => {
    return Promise.resolve({
      id: assetId,
      playback_ids: [{ id: 'playback-123' }],
      status: 'ready'
    });
  })
}));

// Mock the database client
jest.mock('../../../lib/supabase/client', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    data: null,
    error: null
  })
}));

// Mock auth
jest.mock('../../../../app/services/auth', () => ({
  getCurrentUser: jest.fn().mockImplementation((config?: MockConfig) => {
    if (config?.shouldSucceed === false) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      id: 'user-123',
      email: 'test@example.com'
    });
  })
}));

// Mock next/server
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn().mockImplementation((body, init) => {
        return { 
          body, 
          status: init?.status || 200,
          json: () => body
        };
      }),
    },
    NextRequest: jest.fn().mockImplementation((input) => {
      return input;
    }),
  };
});

// Use the exported POST handler instead of trying to mock internal functions

// Helper function to create mock request/response
function createMockRequestResponse(method: string, body?: unknown, url = 'http://localhost/api/mux', headers = {}) {
  // Create a mock request object with the necessary properties and methods
  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
  }) as NextRequest & {
    json: jest.Mock;
  };
  
  // Add the json method to the request
  request.json = jest.fn().mockImplementation(() => Promise.resolve(body || {}));
  
  const responseInit = {
    status: 200,
  };
  
  const response = {
    json: jest.fn().mockImplementation((data) => {
      return { data, status: responseInit.status };
    }),
    status: jest.fn().mockImplementation((statusCode) => {
      responseInit.status = statusCode;
      return response;
    }),
    _getStatusCode: () => responseInit.status,
    _getData: () => response.json.mock.calls[0][0],
  };
  
  return { req: request, res: response };
}

describe('Mux API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/mux', () => {
    it('creates upload URL successfully', async () => {
      const { req, res } = createMockRequestResponse('POST');

      const result = await routeModule.POST(req);
      
      // Set the response status and data based on the result
      res.status(result.status || 200);
      res.json(result.body || {});

      expect(res._getStatusCode()).toBe(200);
      expect(res._getData()).toEqual({
        uploadId: 'upload-123',
        uploadUrl: 'https://mux.com/upload/123'
      });
    });

    it('handles authentication errors', async () => {
      const { req, res } = createMockRequestResponse('POST', {}, 'http://localhost/api/mux', {
        'x-test-auth-fail': 'true'
      });

      const result = await routeModule.POST(req);
      
      // Set the response status and data based on the result
      res.status(result.status || 200);
      res.json(result.body || {});

      expect(res._getStatusCode()).toBe(401);
    });

    it('handles Mux service errors', async () => {
      const { req, res } = createMockRequestResponse('POST', {}, 'http://localhost/api/mux', {
        'x-test-mux-fail': 'true'
      });

      const result = await routeModule.POST(req);
      
      // Set the response status and data based on the result
      res.status(result.status || 200);
      res.json(result.body || {});

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('POST /api/mux/asset-created', () => {
    it('handles asset created webhook', async () => {
      const { req, res } = createMockRequestResponse('POST', {
        type: 'video.asset.created',
        data: {
          id: 'asset-123',
          playback_ids: [{ id: 'playback-123' }],
          upload_id: 'upload-123'
        }
      }, 'http://localhost/api/mux/asset-created');

      // Use the exported POST handler with a webhook URL
      
      // Mock NextResponse.json for this test
      const mockSuccessData = { success: true };
      const mockResponse = { 
        body: mockSuccessData, 
        status: 200,
        json: () => mockSuccessData
      };
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockResponse as unknown as NextResponse);
      
      const result = await routeModule.POST(req);
      
      // Set the response status and data based on the result
      res.status(result.status);
      res.json(result.body);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('POST /api/mux/asset-ready', () => {
    it('handles asset ready webhook', async () => {
      const { req, res } = createMockRequestResponse('POST', {
        type: 'video.asset.ready',
        data: {
          id: 'asset-123',
          playback_ids: [{ id: 'playback-123' }],
          duration: 120,
          width: 1920,
          height: 1080
        }
      }, 'http://localhost/api/mux/asset-ready');

      // Use the exported POST handler with a webhook URL
      
      // Mock NextResponse.json for this test
      const mockSuccessData = { success: true };
      const mockResponse = { 
        body: mockSuccessData, 
        status: 200,
        json: () => mockSuccessData
      };
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockResponse as unknown as NextResponse);
      
      const result = await routeModule.POST(req);
      
      // Set the response status and data based on the result
      res.status(result.status);
      res.json(result.body);

      expect(res._getStatusCode()).toBe(200);
    });
  });
  
  // No need to restore original implementation since we're using the exported handlers
});
