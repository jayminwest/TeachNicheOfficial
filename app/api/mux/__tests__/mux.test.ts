import { createMocks } from 'node-mocks-http';
import { createUploadUrl, handleAssetCreated, handleAssetReady } from '../route';
import { MockConfig } from '../../../../__mocks__/utils/mock-helpers';

// Mock the Mux service
jest.mock('../../../../app/services/mux', () => ({
  createUploadUrl: jest.fn().mockImplementation((config?: MockConfig) => {
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
jest.mock('@/app/lib/supabase/client', () => ({
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

describe('Mux API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/mux', () => {
    it('creates upload URL successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST'
      });

      await createUploadUrl(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        uploadId: 'upload-123',
        uploadUrl: 'https://mux.com/upload/123'
      });
    });

    it('handles authentication errors', async () => {
      const { req, res } = createMocks({
        method: 'POST'
      });

      // Mock auth to fail
      require('../../../../app/services/auth').getCurrentUser.mockImplementationOnce(() => Promise.resolve(null));

      await createUploadUrl(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('handles Mux service errors', async () => {
      const { req, res } = createMocks({
        method: 'POST'
      });

      // Mock Mux to throw an error
      require('../../../../app/services/mux').createUploadUrl.mockImplementationOnce(() => {
        throw new Error('Mux service error');
      });

      await createUploadUrl(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('POST /api/mux/asset-created', () => {
    it('handles asset created webhook', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          type: 'video.asset.created',
          data: {
            id: 'asset-123',
            playback_ids: [{ id: 'playback-123' }]
          }
        }
      });

      await handleAssetCreated(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('POST /api/mux/asset-ready', () => {
    it('handles asset ready webhook', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          type: 'video.asset.ready',
          data: {
            id: 'asset-123',
            playback_ids: [{ id: 'playback-123' }]
          }
        }
      });

      await handleAssetReady(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });
});
