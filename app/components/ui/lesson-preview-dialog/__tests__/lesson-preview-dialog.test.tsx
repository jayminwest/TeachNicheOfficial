import { render, screen } from '@testing-library/react';
import { LessonPreviewDialog } from '@/app/components/ui/lesson-preview-dialog';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; fill?: boolean; className?: string }) => (
    <div className={props.className}>
      <span>Image: {props.alt}</span>
    </div>
  )
}));

// Mock the LessonCheckout component
jest.mock('@/app/components/ui/lesson-checkout', () => ({
  LessonCheckout: () => <button>Purchase</button>
}));

describe('LessonPreviewDialog', () => {
  it('renders dialog with lesson details when open', () => {
    const mockLesson = {
      id: '1',
      title: 'Test Lesson',
      description: 'Test Description',
      price: 29.99,
      thumbnailUrl: '/test-image.jpg',
      averageRating: 4.5,
      totalRatings: 100,
      creatorId: 'creator-1'
    };

    render(
      <LessonPreviewDialog 
        lesson={mockLesson}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Verify content renders
    expect(screen.getByText('Test Lesson')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(100 ratings)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Purchase' })).toBeInTheDocument();
  });
});
