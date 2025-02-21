import { jest } from '@jest/globals';

export const mockMuxClient = {
  Video: {
    Assets: {
      create: jest.fn().mockResolvedValue({
        id: 'asset_123',
        playback_ids: [{ id: 'playback_123' }],
        status: 'ready',
        duration: 120,
        created_at: '2023-01-01T00:00:00.000Z'
      }),
      list: jest.fn().mockResolvedValue({
        data: [{
          id: 'asset_123',
          status: 'ready',
          playback_ids: [{ id: 'playback_123' }]
        }]
      }),
      del: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue({
        id: 'asset_123',
        status: 'ready',
        playback_ids: [{ id: 'playback_123' }]
      })
    },
    PlaybackIds: {
      get: jest.fn().mockResolvedValue({
        id: 'playback_123',
        policy: 'public'
      }),
      create: jest.fn().mockResolvedValue({
        id: 'playback_123',
        policy: 'signed'
      })
    },
    Uploads: {
      create: jest.fn().mockResolvedValue({
        url: 'https://storage.mux.com/upload',
        id: 'upload_123'
      })
    }
  },
  Data: {
    Views: {
      list: jest.fn().mockResolvedValue({
        data: [{
          view_id: 'view_123',
          player_startup_time: 200,
          video_startup_time: 500,
          watched_seconds: 60
        }]
      }),
      get: jest.fn().mockResolvedValue({
        view_id: 'view_123',
        video_title: 'Test Video'
      })
    },
    Metrics: {
      breakdown: jest.fn().mockResolvedValue({
        data: [{
          total_playing_time: 1000,
          total_views: 50
        }]
      })
    }
  }
};
