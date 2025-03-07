import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT } from '@/app/api/profile/route';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

// Mock the createServerSupabaseClient function
jest.mock('@/app/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
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

describe('Profile API Routes', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;
  let mockUser: any;
  let mockProfile: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Supabase client
    mockUser = { id: 'test-user-id' };
    mockProfile = {
      id: 'test-user-id',
      full_name: 'Test User',
      bio: 'Test bio',
      social_media_tag: '@testuser',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
        update: jest.fn().mockReturnThis(),
      }),
    };

    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/profile',
      json: jest.fn().mockResolvedValue({
        full_name: 'Updated Name',
        bio: 'Updated bio',
        social_media_tag: '@updateduser',
      }),
    } as unknown as NextRequest;
  });

  describe('GET', () => {
    it('should return the current user profile when no userId is provided', async () => {
      // Setup
      mockRequest.url = 'http://localhost:3000/api/profile';

      // Execute
      await GET(mockRequest);

      // Verify
      expect(createServerSupabaseClient).toHaveBeenCalled();
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(NextResponse.json).toHaveBeenCalledWith({ profile: mockProfile });
    });

    it('should return a specific user profile when userId is provided', async () => {
      // Setup
      mockRequest.url = 'http://localhost:3000/api/profile?userId=specific-user-id';

      // Execute
      await GET(mockRequest);

      // Verify
      expect(createServerSupabaseClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('id', 'specific-user-id');
      expect(NextResponse.json).toHaveBeenCalledWith({ profile: mockProfile });
    });

    it('should return 401 when user is not authenticated', async () => {
      // Setup
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      // Execute
      await GET(mockRequest);

      // Verify
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    });

    it('should return 500 when there is a database error', async () => {
      // Setup
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Execute
      await GET(mockRequest);

      // Verify
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    });

    it('should handle unexpected errors', async () => {
      // Setup
      mockSupabase.from().select().eq().single.mockRejectedValue(new Error('Unexpected error'));

      // Execute
      await GET(mockRequest);

      // Verify
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      );
    });
  });

  describe('PUT', () => {
    it('should update the user profile successfully', async () => {
      // Setup
      const updatedProfile = { ...mockProfile, full_name: 'Updated Name' };
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      // Execute
      await PUT(mockRequest);

      // Verify
      expect(createServerSupabaseClient).toHaveBeenCalled();
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockRequest.json).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith({ profile: updatedProfile });
    });

    it('should return 401 when user is not authenticated', async () => {
      // Setup
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      // Execute
      await PUT(mockRequest);

      // Verify
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    });

    it('should return 500 when there is a database error', async () => {
      // Setup
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Execute
      await PUT(mockRequest);

      // Verify
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    });

    it('should handle unexpected errors', async () => {
      // Setup
      mockRequest.json.mockRejectedValue(new Error('Unexpected error'));

      // Execute
      await PUT(mockRequest);

      // Verify
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      );
    });
  });
});
