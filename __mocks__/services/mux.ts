import { jest } from '@jest/globals';
import { createMockResponse, createAsyncMock, MockConfig, resetMocks } from '../utils/mock-helpers';

// Types for Mux data
export interface MuxAsset {
  id: string;
  playback_ids: Array<{ id: string }>;
  status: 'preparing' | 'ready' | 'errored';
  duration?: number;
  created_at: string;
  aspect_ratio?: string;
  max_stored_resolution?: string;
  max_stored_frame_rate?: number;
}

export interface MuxPlaybackId {
  id: string;
  policy: 'public' | 'signed';
}

export interface MuxUpload {
  id: string;
  url: string;
  status?: 'waiting' | 'asset_created' | 'errored';
  new_asset_settings?: Record<string, any>;
  cors_origin?: string;
}

export interface MuxView {
  view_id: string;
  player_startup_time?: number;
  video_startup_time?: number;
  watched_seconds?: number;
  video_title?: string;
}

export interface MuxMetrics {
  total_playing_time: number;
  total_views: number;
  viewer_count?: number;
  player_error_count?: number;
}

// Factory functions to create mock data
export const createMockAsset = (overrides = {}): MuxAsset => ({
  id: 'asset_123',
  playback_ids: [{ id: 'playback_123' }],
  status: 'ready',
  duration: 120,
  created_at: '2023-01-01T00:00:00.000Z',
  aspect_ratio: '16:9',
  max_stored_resolution: '1080p',
  max_stored_frame_rate: 30,
  ...overrides
});

export const createMockPlaybackId = (overrides = {}): MuxPlaybackId => ({
  id: 'playback_123',
  policy: 'public',
  ...overrides
});

export const createMockUpload = (overrides = {}): MuxUpload => ({
  id: 'upload_123',
  url: 'https://storage.mux.com/upload',
  status: 'waiting',
  new_asset_settings: {},
  cors_origin: '*',
  ...overrides
});

export const createMockView = (overrides = {}): MuxView => ({
  view_id: 'view_123',
  player_startup_time: 200,
  video_startup_time: 500,
  watched_seconds: 60,
  video_title: 'Test Video',
  ...overrides
});

export const createMockMetrics = (overrides = {}): MuxMetrics => ({
  total_playing_time: 1000,
  total_views: 50,
  viewer_count: 10,
  player_error_count: 0,
  ...overrides
});

// Create mock Mux client with configurable behavior
export const createMockMuxClient = (config: MockConfig = {}) => {
  const mockAsset = createMockAsset();
  const mockPlaybackId = createMockPlaybackId();
  const mockUpload = createMockUpload();
  const mockView = createMockView();
  const mockMetrics = createMockMetrics();

  return {
    Video: {
      Assets: {
        create: createAsyncMock(mockAsset, config),
        list: createAsyncMock({ data: [mockAsset] }, config),
        get: createAsyncMock(mockAsset, config),
        del: createAsyncMock({}, config),
        update: createAsyncMock(mockAsset, config),
        inputInfo: createAsyncMock({ 
          tracks: [{ type: 'video', max_width: 1920, max_height: 1080 }] 
        }, config)
      },
      PlaybackIds: {
        get: createAsyncMock(mockPlaybackId, config),
        create: createAsyncMock(mockPlaybackId, config),
        delete: createAsyncMock({}, config)
      },
      Uploads: {
        create: createAsyncMock(mockUpload, config),
        cancel: createAsyncMock({}, config)
      }
    },
    Data: {
      Views: {
        list: createAsyncMock({ data: [mockView] }, config),
        get: createAsyncMock(mockView, config)
      },
      Metrics: {
        breakdown: createAsyncMock({ data: [mockMetrics] }, config),
        overall: createAsyncMock(mockMetrics, config)
      },
      Exports: {
        create: createAsyncMock({ id: 'export_123' }, config),
        get: createAsyncMock({ status: 'ready', download_url: 'https://example.com/export' }, config)
      }
    }
  };
};

export const mockMuxClient = createMockMuxClient();

// Mock the createUpload function that's exported from app/services/mux.ts
export const createUpload = jest.fn().mockImplementation((isFree = false) => {
  return Promise.resolve({
    url: 'https://storage.mux.com/upload',
    uploadId: 'upload_123'
  });
});

// Mock other exported functions from app/services/mux.ts
export const getAsset = jest.fn().mockImplementation((assetId) => {
  return Promise.resolve(createMockAsset({ id: assetId }));
});

export const getUpload = jest.fn().mockImplementation((uploadId) => {
  return Promise.resolve(createMockUpload({ id: uploadId }));
});

export const getPlaybackId = jest.fn().mockImplementation(() => {
  return Promise.resolve('playback_123');
});

export const deleteAsset = jest.fn().mockImplementation(() => {
  return Promise.resolve(true);
});

// Export function to reset all mocks
export const resetMuxMocks = () => {
  resetMocks(mockMuxClient);
  createUpload.mockClear();
  getAsset.mockClear();
  getUpload.mockClear();
  getPlaybackId.mockClear();
  deleteAsset.mockClear();
};
