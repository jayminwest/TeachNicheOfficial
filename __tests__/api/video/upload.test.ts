import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';
import { headers } from 'next/headers';
import { POST, PUT, OPTIONS } from '@/app/api/video/upload/route';
import fs from 'fs';
import path from 'path';

// Mock Next.js runtime
const originalGlobal = global;
(global as any).Request = class MockRequest {
  constructor() {}
};

// Mock the next/headers module
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: (key: string) => {
      const headers = {
        'origin': 'http://localhost:3000',
        'method': 'POST',
        'content-type': 'video/mp4',
        'content-length': '1000000',
        'content-range': 'bytes 0-999999/2000000',
        'authorization': 'Bearer test-token'
      };
      return headers[key.toLowerCase()] || null;
    }
  }))
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      headers: new Headers(init?.headers || {}),
      json: async () => body
    }))
  }
}));

// Mock the Mux client
jest.mock('@/lib/mux', () => ({
  createUpload: jest.fn()
}));

describe('Video Upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful upload initialization', async () => {
    const mockUploadResponse = {
      url: 'https://mock-upload-url.mux.com',
      id: 'mock-asset-id'
    };
    
    (createUpload as jest.Mock).mockResolvedValueOnce(mockUploadResponse);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      uploadUrl: mockUploadResponse.url,
      assetId: mockUploadResponse.id
    });
  });

  it('should handle upload initialization failure', async () => {
    const mockError = new Error('Mux API error');
    (createUpload as jest.Mock).mockRejectedValueOnce(mockError);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to initialize video upload. Please try again.');
    expect(data.details).toBe('Mux API error');
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    const headers = new Headers(response.headers);
    expect(headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    expect(headers.get('Access-Control-Allow-Methods')).toBe('POST, PUT, OPTIONS');
    expect(headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Content-Length, Content-Range, Authorization, X-Mux-Upload-Url');
  });

  it('should handle PUT request same as POST', async () => {
    const mockUploadResponse = {
      url: 'https://mock-upload-url.mux.com',
      id: 'mock-asset-id'
    };
    
    (createUpload as jest.Mock).mockResolvedValueOnce(mockUploadResponse);

    const response = await PUT();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      uploadUrl: mockUploadResponse.url,
      assetId: mockUploadResponse.id
    });
  });

  it('should handle actual video file upload', async () => {
    const videoPath = path.join(process.cwd(), 'public', 'test_video.mov');
    const videoBuffer = fs.readFileSync(videoPath);
    const videoStats = fs.statSync(videoPath);

    // Mock headers for video upload
    (headers as jest.Mock).mockReturnValueOnce({
      get: (key: string) => ({
        'origin': 'http://localhost:3000',
        'method': 'PUT',
        'content-type': 'video/quicktime',
        'content-length': videoStats.size.toString(),
        'content-range': `bytes 0-${videoStats.size - 1}/${videoStats.size}`,
        'x-mux-upload-url': 'https://mock-upload-url.mux.com'
      }[key.toLowerCase()] || null)
    });

    // Mock global fetch
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK'
    });

    const mockUploadResponse = {
      url: 'https://mock-upload-url.mux.com',
      id: 'mock-asset-id'
    };
    
    (createUpload as jest.Mock).mockResolvedValueOnce(mockUploadResponse);

    const response = await PUT();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      uploadUrl: mockUploadResponse.url,
      assetId: mockUploadResponse.id
    });
  });
});
