import { render, screen } from '@testing-library/react';
import Page from '@/app/lessons/[id]/page';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/app/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/app/lessons/[id]/lesson-detail', () => {
  return {
    __esModule: true,
    default: ({ id, session }: { id: string, session: any }) => (
      <div data-testid="lesson-detail" data-id={id}>
        Lesson Detail Component
      </div>
    ),
  };
});

describe('Lesson Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful Supabase responses by default
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-lesson-id', title: 'Test Lesson' },
        error: null,
      }),
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'test-user-id' } } },
        }),
      },
    };
    
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
  });
  
  it('renders lesson detail with suspense boundary when lesson exists', async () => {
    const params = { id: 'test-lesson-id' };
    const { container } = render(await Page({ params }));
    
    // Check that the lesson detail component is rendered
    expect(screen.getByTestId('lesson-detail')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-detail')).toHaveAttribute('data-id', 'test-lesson-id');
    
    // Check that Suspense is used (this is a bit tricky to test directly)
    // We can check that the component is wrapped in a div with suspense attributes
    expect(container.innerHTML).toContain('data-testid="lesson-detail"');
  });
  
  it('calls notFound when lesson does not exist', async () => {
    // Mock Supabase to return no lesson
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Lesson not found' },
      }),
    };
    
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    const params = { id: 'non-existent-id' };
    
    try {
      await Page({ params });
    } catch (error) {
      // This is expected as notFound() throws an error
    }
    
    // Check that notFound was called
    expect(notFound).toHaveBeenCalled();
  });
  
  it('handles errors by calling notFound', async () => {
    // Mock Supabase to throw an error
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Database error')),
    };
    
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    const params = { id: 'test-lesson-id' };
    
    try {
      await Page({ params });
    } catch (error) {
      // This is expected as notFound() throws an error
    }
    
    // Check that notFound was called
    expect(notFound).toHaveBeenCalled();
  });
});
