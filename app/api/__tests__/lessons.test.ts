import { NextResponse } from 'next/server';
import { GET } from '@/app/api/lessons/route';
import { createClient } from '@supabase/supabase-js';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({ 
      data, 
      init,
      status: init?.status || 200
    })),
  },
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Lessons API Route', () => {
  // Store environment variables to restore them later
  const originalEnv = process.env;
  
  // Setup mocks before each test
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env = { 
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-url.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      NODE_ENV: 'test'
    };
    
    // Mock console methods to prevent noise in test output
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Setup default mock implementation for Supabase client
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockIs = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    
    const mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      order: mockOrder,
    });
    
    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
  });
  
  // Restore environment and console after tests
  afterEach(() => {
    process.env = originalEnv;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  it('should return transformed lessons when successful', async () => {
    // Mock successful response from Supabase
    const mockLessons = [
      {
        id: 'lesson-1',
        title: 'Test Lesson 1',
        description: 'Test Description 1',
        price: 19.99,
        thumbnail_url: 'https://example.com/thumb1.jpg',
        creator_id: 'creator-1',
        status: 'published',
        deleted_at: null,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'lesson-2',
        title: 'Test Lesson 2',
        description: 'Test Description 2',
        price: 29.99,
        thumbnail_url: 'https://example.com/thumb2.jpg',
        creator_id: 'creator-2',
        status: 'published',
        deleted_at: null,
        created_at: '2025-01-02T00:00:00Z'
      }
    ];
    
    // Setup the mock to return our test data
    const mockSupabaseResponse = {
      data: mockLessons,
      error: null
    };
    
    const mockOrder = jest.fn().mockResolvedValue(mockSupabaseResponse);
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    
    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom
    });
    
    // Call the API route handler
    await GET();
    
    // Verify Supabase client was created with correct parameters
    expect(createClient).toHaveBeenCalledWith(
      'https://test-url.supabase.co',
      'test-service-role-key'
    );
    
    // Verify the query was constructed correctly
    expect(mockFrom).toHaveBeenCalledWith('lessons');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('status', 'published');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    
    // Verify the response contains transformed lessons
    expect(NextResponse.json).toHaveBeenCalledWith({
      lessons: [
        {
          id: 'lesson-1',
          title: 'Test Lesson 1',
          description: 'Test Description 1',
          price: 19.99,
          thumbnailUrl: 'https://example.com/thumb1.jpg',
          creatorId: 'creator-1',
          averageRating: 0,
          totalRatings: 0
        },
        {
          id: 'lesson-2',
          title: 'Test Lesson 2',
          description: 'Test Description 2',
          price: 29.99,
          thumbnailUrl: 'https://example.com/thumb2.jpg',
          creatorId: 'creator-2',
          averageRating: 0,
          totalRatings: 0
        }
      ]
    });
  });
  
  it('should handle missing service role key', async () => {
    // Remove the service role key from environment
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    // Call the API route handler
    await GET();
    
    // Verify error response
    expect(NextResponse.json).toHaveBeenCalledWith({
      lessons: [],
      error: 'Service role key not configured'
    });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should handle Supabase query error', async () => {
    // Setup mock to simulate a Supabase error
    const mockError = {
      message: 'Database error',
      code: 'PGRST116',
      hint: 'Check your query',
      details: 'Error details'
    };
    
    const mockSupabaseResponse = {
      data: null,
      error: mockError
    };
    
    const mockOrder = jest.fn().mockResolvedValue(mockSupabaseResponse);
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    
    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom
    });
    
    // Call the API route handler
    await GET();
    
    // Verify error response
    expect(NextResponse.json).toHaveBeenCalledWith({
      lessons: [],
      debug: {
        error: 'Database error',
        code: 'PGRST116',
        hint: 'Check your query',
        details: 'Error details'
      }
    });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should handle unexpected exceptions', async () => {
    // Setup mock to throw an exception
    (createClient as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    
    // Call the API route handler
    await GET();
    
    // Verify error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: { message: 'An unexpected error occurred' } },
      { status: 500 }
    );
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should handle null lessons data', async () => {
    // Setup mock to return null data
    const mockSupabaseResponse = {
      data: null,
      error: null
    };
    
    const mockOrder = jest.fn().mockResolvedValue(mockSupabaseResponse);
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    
    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom
    });
    
    // Call the API route handler
    await GET();
    
    // Verify response with empty lessons array
    expect(NextResponse.json).toHaveBeenCalledWith({
      lessons: []
    });
  });
  
  it('should handle lessons with missing fields', async () => {
    // Mock lessons with missing fields
    const mockLessons = [
      {
        // Missing id
        title: 'Test Lesson',
        // Missing description
        // Missing price
        // Missing thumbnail_url
        creator_id: 'creator-1',
        status: 'published',
        deleted_at: null
      }
    ];
    
    const mockSupabaseResponse = {
      data: mockLessons,
      error: null
    };
    
    const mockOrder = jest.fn().mockResolvedValue(mockSupabaseResponse);
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    
    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom
    });
    
    // Call the API route handler
    await GET();
    
    // Verify response with default values for missing fields
    expect(NextResponse.json).toHaveBeenCalledWith({
      lessons: [
        {
          id: '',
          title: 'Test Lesson',
          description: 'No description available',
          price: 0,
          thumbnailUrl: '',
          creatorId: 'creator-1',
          averageRating: 0,
          totalRatings: 0
        }
      ]
    });
  });
});
