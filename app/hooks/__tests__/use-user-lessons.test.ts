import { renderHook, waitFor } from '@testing-library/react';
import { useUserLessons } from '../use-user-lessons';
import { supabase } from '@/app/services/supabase';
import { useAuth } from '@/app/services/auth/AuthContext';

// Mock dependencies
jest.mock('@/app/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn()
          }))
        }))
      }))
    }))
  },
}));

jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('useUserLessons', () => {
  const mockUser = { id: 'user-123' };
  const mockLessons = [
    {
      id: 'lesson-1',
      title: 'Test Lesson 1',
      description: 'Description 1',
      price: 19.99,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      thumbnail_url: '/test-thumbnail-1.jpg',
      mux_asset_id: 'asset-1',
      mux_playback_id: 'playback-1',
      creator_id: 'user-123',
      status: 'published',
      is_featured: true,
    },
    {
      id: 'lesson-2',
      title: 'Test Lesson 2',
      description: null,
      price: 29.99,
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-04T00:00:00Z',
      thumbnail_url: null,
      mux_asset_id: 'asset-2',
      mux_playback_id: 'playback-2',
      creator_id: 'user-123',
      status: 'draft',
      is_featured: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  it('should return empty lessons array when user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    
    const { result } = renderHook(() => useUserLessons());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.lessons).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should fetch and format lessons correctly', async () => {
    // Mock the Supabase response
    const mockLimit = jest.fn().mockResolvedValue({
      data: mockLessons,
      error: null,
    });
    const mockOrder = jest.fn(() => ({ limit: mockLimit }));
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useUserLessons());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lessons).toHaveLength(2);
    expect(result.current.lessons[0]).toEqual({
      id: 'lesson-1',
      title: 'Test Lesson 1',
      description: 'Description 1',
      price: 19.99,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      thumbnailUrl: '/test-thumbnail-1.jpg',
      mux_asset_id: 'asset-1',
      mux_playback_id: 'playback-1',
      creator_id: 'user-123',
      status: 'published',
      isFeatured: true,
      averageRating: 0,
      totalRatings: 0
    });
    expect(result.current.lessons[1].description).toBe('');
    expect(result.current.lessons[1].thumbnailUrl).toBe('/placeholder-thumbnail.jpg');
    expect(result.current.lessons[1].published).toBe(false);
  });

  it('should handle errors correctly', async () => {
    const testError = new Error('Database error');
    
    // Mock the Supabase response with an error
    const mockLimit = jest.fn().mockResolvedValue({
      data: null,
      error: testError,
    });
    const mockOrder = jest.fn(() => ({ limit: mockLimit }));
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useUserLessons());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lessons).toEqual([]);
    expect(result.current.error).toEqual(testError);
  });

  it('should use custom options correctly', async () => {
    // Mock the Supabase response
    const mockLimit = jest.fn().mockResolvedValue({
      data: mockLessons,
      error: null,
    });
    const mockOrder = jest.fn(() => ({ limit: mockLimit }));
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    renderHook(() => useUserLessons({ 
      limit: 10, 
      orderBy: 'title', 
      orderDirection: 'asc' 
    }));

    expect(supabase.from).toHaveBeenCalledWith('lessons');
    expect(mockSelect).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('creator_id', 'user-123');
    expect(mockOrder).toHaveBeenCalledWith('title', { ascending: true });
    expect(mockLimit).toHaveBeenCalledWith(10);
  });
});
