import { jest } from '@jest/globals';

export const mockMuxClient = {
  Video: {
    Assets: {
      create: jest.fn(),
      list: jest.fn(),
      del: jest.fn(),
    },
    PlaybackIds: {
      get: jest.fn(),
    },
  },
  Data: {
    Views: {
      list: jest.fn(),
    },
  },
};
