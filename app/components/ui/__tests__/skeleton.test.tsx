import React from 'react';
import { render } from '@testing-library/react';
import { Skeleton } from '../skeleton';

// Mock the cn utility
jest.mock('@/app/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('Skeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<Skeleton />);
    const skeletonElement = container.firstChild as HTMLElement;
    
    expect(skeletonElement).toHaveClass('animate-pulse');
    expect(skeletonElement).toHaveClass('rounded-md');
    expect(skeletonElement).toHaveClass('bg-muted');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-20 custom-class" />);
    const skeletonElement = container.firstChild as HTMLElement;
    
    expect(skeletonElement).toHaveClass('animate-pulse');
    expect(skeletonElement).toHaveClass('rounded-md');
    expect(skeletonElement).toHaveClass('bg-muted');
    expect(skeletonElement).toHaveClass('h-10');
    expect(skeletonElement).toHaveClass('w-20');
    expect(skeletonElement).toHaveClass('custom-class');
  });

  it('passes additional props to the div element', () => {
    const { container } = render(
      <Skeleton data-testid="skeleton-test" aria-label="Loading" />
    );
    const skeletonElement = container.firstChild as HTMLElement;
    
    expect(skeletonElement).toHaveAttribute('data-testid', 'skeleton-test');
    expect(skeletonElement).toHaveAttribute('aria-label', 'Loading');
  });
});
