import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentManagement } from '../content-management';
import { useUserLessons } from '@/app/hooks/use-user-lessons';

// Mock the hooks and components
jest.mock('@/app/hooks/use-user-lessons');
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src} alt={props.alt} />;
  },
}));
jest.mock('@/app/utils/format', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

describe('ContentManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    (useUserLessons as jest.Mock).mockReturnValue({
      lessons: [],
      loading: true,
      error: null,
    });

    render(<ContentManagement />);
    
    expect(screen.getByText('Loading your lessons...')).toBeInTheDocument();
    expect(screen.queryByText('No lessons found.')).not.toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    (useUserLessons as jest.Mock).mockReturnValue({
      lessons: [],
      loading: false,
      error: new Error('Test error'),
    });

    render(<ContentManagement />);
    
    expect(screen.getByText('Error loading your lessons. Please try again later.')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    (useUserLessons as jest.Mock).mockReturnValue({
      lessons: [],
      loading: false,
      error: null,
    });

    render(<ContentManagement />);
    
    expect(screen.getByText('No lessons found. Create your first lesson to get started.')).toBeInTheDocument();
  });

  it('renders lessons correctly', () => {
    const mockLessons = [
      {
        id: 'lesson-1',
        title: 'Test Lesson 1',
        description: 'Description 1',
        price: 19.99,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
        thumbnailUrl: '/test-thumbnail-1.jpg',
        videoAssetId: 'asset-1',
        videoPlaybackId: 'playback-1',
        creatorId: 'user-123',
        published: true,
        isFeatured: true,
      },
      {
        id: 'lesson-2',
        title: 'Test Lesson 2',
        description: 'Description 2',
        price: 29.99,
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
        thumbnailUrl: '/test-thumbnail-2.jpg',
        videoAssetId: 'asset-2',
        videoPlaybackId: 'playback-2',
        creatorId: 'user-123',
        published: false,
        isFeatured: false,
      },
    ];

    (useUserLessons as jest.Mock).mockReturnValue({
      lessons: mockLessons,
      loading: false,
      error: null,
    });

    render(<ContentManagement />);
    
    // Check if lessons are rendered
    expect(screen.getByText('Test Lesson 1')).toBeInTheDocument();
    expect(screen.getByText('Test Lesson 2')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
    
    // Check price formatting
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    
    // Check status display
    expect(screen.getByText('Published • Featured')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    
    // Check if images are rendered with correct props
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', '/test-thumbnail-1.jpg');
    expect(images[1]).toHaveAttribute('src', '/test-thumbnail-2.jpg');
  });

  it('shows "View all lessons" button when there are 5 or more lessons', () => {
    const mockLessons = Array(5).fill(null).map((_, i) => ({
      id: `lesson-${i}`,
      title: `Test Lesson ${i}`,
      description: `Description ${i}`,
      price: 19.99 + i,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      thumbnailUrl: `/test-thumbnail-${i}.jpg`,
      videoAssetId: `asset-${i}`,
      videoPlaybackId: `playback-${i}`,
      creatorId: 'user-123',
      published: i % 2 === 0,
      isFeatured: i === 0,
    }));

    (useUserLessons as jest.Mock).mockReturnValue({
      lessons: mockLessons,
      loading: false,
      error: null,
    });

    render(<ContentManagement />);
    
    expect(screen.getByText('View all lessons')).toBeInTheDocument();
  });

  it('does not show "View all lessons" button when there are fewer than 5 lessons', () => {
    const mockLessons = Array(4).fill(null).map((_, i) => ({
      id: `lesson-${i}`,
      title: `Test Lesson ${i}`,
      description: `Description ${i}`,
      price: 19.99 + i,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      thumbnailUrl: `/test-thumbnail-${i}.jpg`,
      videoAssetId: `asset-${i}`,
      videoPlaybackId: `playback-${i}`,
      creatorId: 'user-123',
      published: i % 2 === 0,
      isFeatured: i === 0,
    }));

    (useUserLessons as jest.Mock).mockReturnValue({
      lessons: mockLessons,
      loading: false,
      error: null,
    });

    render(<ContentManagement />);
    
    expect(screen.queryByText('View all lessons')).not.toBeInTheDocument();
  });
});
