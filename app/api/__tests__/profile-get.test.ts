import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/profile/get/route';
import { createClient } from '@supabase/supabase-js';

// Mock the createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((data, init) => {
        return {
          data,
          status: init?.status || 200,
        };
      }),
    },
  };
});

describe('Profile Get API Route', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;
  let mockProfile: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase-url.com';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    // Mock profile data
    mockProfile = {
      id: 'test-user-id',
      full_name: 'Test User',
      bio: 'Test bio',
      social_media_tag: '@testuser',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    };

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/profile/get?userId=test-user-id',
    } as unknown as NextRequest;
  });

  it('should return the profile when userId is provided', async () => {
    // Execute
    await GET(mockRequest);

    // Verify
    expect(createClient).toHaveBeenCalledWith(
      'https://test-supabase-url.com',
      'test-service-role-key',
      expect.any(Object)
    );
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('id', 'test-user-id');
    expect(NextResponse.json).toHaveBeenCalledWith({ data: mockProfile });
  });

  it('should return 400 when userId is not provided', async () => {
    // Setup
    mockRequest.url = 'http://localhost:3000/api/profile/get';

    // Execute
    await GET(mockRequest);

    // Verify
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'User ID is required' },
      { status: 400 }
    );
  });

  it('should return null data when profile does not exist', async () => {
    // Setup
    mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null, error: null });

    // Execute
    await GET(mockRequest);

    // Verify
    expect(NextResponse.json).toHaveBeenCalledWith({ data: null });
  });

  it('should return 500 when there is a database error', async () => {
    // Setup
    mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    // Execute
    await GET(mockRequest);

    // Verify
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to fetch profile: Database error' },
      { status: 500 }
    );
  });

  it('should handle unexpected errors', async () => {
    // Setup
    mockSupabase.from().select().eq().maybeSingle.mockRejectedValue(new Error('Unexpected error'));

    // Execute
    await GET(mockRequest);

    // Verify
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  });
});
