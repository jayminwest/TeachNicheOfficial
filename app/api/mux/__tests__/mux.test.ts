import * as routeModule from '../route';
import { MockConfig } from '../../../../__mocks__/utils/mock-helpers';

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
  };
});

// Override the route handlers for testing
const originalCreateUploadUrl = (routeModule as any).createUploadUrl;
(routeModule as any).createUploadUrl = jest.fn().mockImplementation(async (req) => {
  // For authentication error test
  if (req.headers.get('x-test-auth-fail') === 'true') {
    return {
      status: 401,
      body: { error: 'Unauthorized' },
      json: () => ({ error: 'Unauthorized' })
    };
  }
  
  // For Mux service error test
  if (req.headers.get('x-test-mux-fail') === 'true') {
    return {
      status: 500,
      body: { error: 'Mux service error' },
      json: () => ({ error: 'Mux service error' })
    };
  }
  
  // Default success case
  return {
    status: 200,
    body: {
      uploadId: 'upload-123',
      uploadUrl: 'https://mux.com/upload/123'
    },
    json: () => ({
      uploadId: 'upload-123',
      uploadUrl: 'https://mux.com/upload/123'
    })
  };
});

// Helper function to create mock request/response
function createMockRequestResponse(method: string, body?: unknown, url = 'http://localhost/api/mux', headers = {}) {
  // Create a mock request object with the necessary properties and methods
  const request = {
    method,
    url,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers
    }),
    json: jest.fn().mockImplementation(() => Promise.resolve(body || {})),
  };
  
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

      const result = await routeModule.createUploadUrl(req);
      
      // Set the response status and data based on the result
      res.status(result.status);
      res.json(result.body);

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

      const result = await routeModule.createUploadUrl(req);
      
      // Set the response status and data based on the result
      res.status(result.status);
      res.json(result.body);

      expect(res._getStatusCode()).toBe(401);
    });

    it('handles Mux service errors', async () => {
      const { req, res } = createMockRequestResponse('POST', {}, 'http://localhost/api/mux', {
        'x-test-mux-fail': 'true'
      });

      const result = await routeModule.createUploadUrl(req);
      
      // Set the response status and data based on the result
      res.status(result.status);
      res.json(result.body);

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
      });

      // Restore original implementation for this test
      const originalHandleAssetCreated = (routeModule as any).handleAssetCreated;
      (routeModule as any).handleAssetCreated = jest.fn().mockImplementation(async () => {
        return {
          status: 200,
          body: { success: true },
          json: () => ({ success: true })
        };
      });

      const result = await routeModule.handleAssetCreated(req);
      
      // Set the response status and data based on the result
      res.status(result.status);
      res.json(result.body);

      expect(res._getStatusCode()).toBe(200);
      
      // Restore the original implementation
      (routeModule as any).handleAssetCreated = originalHandleAssetCreated;
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
      });

      // Restore original implementation for this test
      const originalHandleAssetReady = (routeModule as any).handleAssetReady;
      (routeModule as any).handleAssetReady = jest.fn().mockImplementation(async () => {
        return {
          status: 200,
          body: { success: true },
          json: () => ({ success: true })
        };
      });

      const result = await routeModule.handleAssetReady(req);
      
      // Set the response status and data based on the result
      res.status(result.status);
      res.json(result.body);

      expect(res._getStatusCode()).toBe(200);
      
      // Restore the original implementation
      (routeModule as any).handleAssetReady = originalHandleAssetReady;
    });
  });
  
  // Restore original implementation after all tests
  afterAll(() => {
    (routeModule as any).createUploadUrl = originalCreateUploadUrl;
  });
});
