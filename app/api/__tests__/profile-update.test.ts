import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/profile/update/route';
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

describe('Profile Update API Route', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;
  let mockRequestData: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase-url.com';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    // Mock request data
    mockRequestData = {
      userId: 'test-user-id',
      userEmail: 'test@example.com',
      full_name: 'Test User',
      bio: 'Test bio',
      social_media_tag: '@testuser',
    };

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock request
    mockRequest = {
      json: jest.fn().mockResolvedValue(mockRequestData),
    } as unknown as NextRequest;
  });

  it('should update an existing profile successfully', async () => {
    // Setup
    mockSupabase.from().update.mockReturnValue({
      error: null,
    });

    // Execute
    await POST(mockRequest);

    // Verify
    expect(createClient).toHaveBeenCalledWith(
      'https://test-supabase-url.com',
      'test-service-role-key',
      expect.any(Object)
    );
    expect(mockRequest.json).toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.from().select).toHaveBeenCalledWith('id');
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('id', 'test-user-id');
    expect(mockSupabase.from().update).toHaveBeenCalledWith({
      full_name: 'Test User',
      bio: 'Test bio',
      social_media_tag: '@testuser',
      updated_at: expect.any(String),
    });
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it('should create a new profile when it does not exist', async () => {
    // Setup
    mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.from().insert.mockReturnValue({
      error: null,
    });

    // Execute
    await POST(mockRequest);

    // Verify
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      bio: 'Test bio',
      social_media_tag: '@testuser',
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it('should return 400 when userId is not provided', async () => {
    // Setup
    mockRequest.json.mockResolvedValue({
      ...mockRequestData,
      userId: undefined,
    });

    // Execute
    await POST(mockRequest);

    // Verify
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'User ID and email are required' },
      { status: 400 }
    );
  });

  it('should return 400 when userEmail is not provided', async () => {
    // Setup
    mockRequest.json.mockResolvedValue({
      ...mockRequestData,
      userEmail: undefined,
    });

    // Execute
    await POST(mockRequest);

    // Verify
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'User ID and email are required' },
      { status: 400 }
    );
  });

  it('should return 500 when there is a database error during update', async () => {
    // Setup
    mockSupabase.from().update.mockReturnValue({
      error: { message: 'Database error' },
    });

    // Execute
    await POST(mockRequest);

    // Verify
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to update profile: Database error' },
      { status: 500 }
    );
  });

  it('should return 500 when there is a database error during insert', async () => {
    // Setup
    mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.from().insert.mockReturnValue({
      error: { message: 'Database error' },
    });

    // Execute
    await POST(mockRequest);

    // Verify
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to update profile: Database error' },
      { status: 500 }
    );
  });

  it('should handle unexpected errors', async () => {
    // Setup
    mockRequest.json.mockRejectedValue(new Error('Unexpected error'));

    // Execute
    await POST(mockRequest);

    // Verify
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  });
});
