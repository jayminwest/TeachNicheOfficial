import { NextRequest, NextResponse } from 'next/server';
import { createUploadUrl, handleAssetCreated, handleAssetReady } from '../route';
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

// Helper function to create mock request/response
function createMockRequestResponse(method: string, body?: any, url = 'http://localhost/api/mux') {
  // Create a NextRequest directly instead of using NextRequest.from
  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const responseInit = {
    headers: new Headers(),
    status: 200,
  };
  
  const response = {
    json: jest.fn().mockImplementation((data) => NextResponse.json(data, responseInit)),
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

      await createUploadUrl(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getData()).toEqual({
        uploadId: 'upload-123',
        uploadUrl: 'https://mux.com/upload/123'
      });
    });

    it('handles authentication errors', async () => {
      const { req, res } = createMockRequestResponse('POST');

      // Mock auth to fail
      require('../../../../app/services/auth').getCurrentUser.mockImplementationOnce(() => Promise.resolve(null));

      await createUploadUrl(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('handles Mux service errors', async () => {
      const { req, res } = createMockRequestResponse('POST');

      // Mock Mux to throw an error
      require('../../../../app/services/mux').createUpload.mockImplementationOnce(() => {
        throw new Error('Mux service error');
      });

      await createUploadUrl(req, res);

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

      await handleAssetCreated(req, res);

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
      });

      await handleAssetReady(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });
});
