import React from 'react';
import { render, screen } from '@testing-library/react';
import { LessonCard } from '../lesson-card';
import { formatPrice } from '@/app/lib/constants';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={props.src} alt={props.alt} style={props.fill ? { objectFit: 'cover' } : {}} data-testid="next-image" />;
  },
}));

// Mock the LessonPreviewDialog component
jest.mock('../lesson-preview-dialog', () => ({
  LessonPreviewDialog: ({ lesson, isOpen, onClose }: any) => (
    <div data-testid="lesson-preview-dialog">
      {isOpen ? 'Open' : 'Closed'}
    </div>
  ),
}));

// Mock the LessonCheckout component
jest.mock('../lesson-checkout', () => ({
  LessonCheckout: ({ lessonId, price }: any) => (
    <div data-testid="lesson-checkout">
      Checkout for {lessonId} at {price} cents
    </div>
  ),
}));

describe('LessonCard', () => {
  const mockLesson = {
    id: 'lesson-123',
    title: 'Test Lesson',
    description: 'This is a test lesson description',
    price: 19.99,
    thumbnailUrl: '/test-image.jpg',
    averageRating: 4.5,
    totalRatings: 10,
  };

  const mockFreeLesson = {
    ...mockLesson,
    id: 'free-lesson-123',
    price: 0,
  };

  it('renders the lesson card with correct information', () => {
    render(<LessonCard lesson={mockLesson} />);
    
    expect(screen.getByTestId('lesson-card')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-card-title')).toHaveTextContent('Test Lesson');
    expect(screen.getByTestId('lesson-description')).toHaveTextContent('This is a test lesson description');
    expect(screen.getByTestId('lesson-price')).toHaveTextContent(formatPrice(19.99));
    expect(screen.getByTestId('next-image')).toHaveAttribute('src', '/test-image.jpg');
    expect(screen.getByTestId('lesson-checkout')).toBeInTheDocument();
  });

  it('displays "Free" for lessons with zero price', () => {
    render(<LessonCard lesson={mockFreeLesson} />);
    
    expect(screen.getByTestId('lesson-price')).toHaveTextContent('Free');
    expect(screen.getByTestId('lesson-price').querySelector('span')).toHaveClass('text-green-600');
    expect(screen.queryByTestId('lesson-checkout')).not.toBeInTheDocument();
  });

  it('formats price correctly using formatPrice utility', () => {
    render(<LessonCard lesson={mockLesson} />);
    
    // The formatPrice utility should format 19.99 as "$19.99"
    expect(screen.getByTestId('lesson-price')).toHaveTextContent(formatPrice(19.99));
  });

  it('handles long titles with proper truncation', () => {
    const longTitleLesson = {
      ...mockLesson,
      title: 'This is an extremely long lesson title that should be truncated in the UI to prevent layout issues and ensure consistent card appearance across the application',
    };
    
    render(<LessonCard lesson={longTitleLesson} />);
    
    const titleElement = screen.getByTestId('lesson-card-title');
    expect(titleElement).toHaveClass('line-clamp-2');
  });

  it('handles long descriptions with proper truncation', () => {
    const longDescLesson = {
      ...mockLesson,
      description: 'This is an extremely long lesson description that contains a lot of text. It should be truncated in the UI to prevent layout issues and ensure consistent card appearance across the application. We want to make sure that no matter how long the description is, the card maintains its proper layout and appearance.',
    };
    
    render(<LessonCard lesson={longDescLesson} />);
    
    const descElement = screen.getByTestId('lesson-description');
    expect(descElement).toHaveClass('line-clamp-3');
  });

  it('has responsive text sizing', () => {
    render(<LessonCard lesson={mockLesson} />);
    
    const titleElement = screen.getByTestId('lesson-card-title');
    const descElement = screen.getByTestId('lesson-description');
    
    expect(titleElement).toHaveClass('text-sm sm:text-base');
    expect(descElement).toHaveClass('text-xs sm:text-sm');
  });

  it('converts dollars to cents for the checkout component', () => {
    render(<LessonCard lesson={mockLesson} />);
    
    // Price should be converted from 19.99 dollars to 1999 cents
    expect(screen.getByTestId('lesson-checkout')).toHaveTextContent('1999 cents');
  });
});
