import { render, screen } from '@testing-library/react';
import { SearchParamsWrapper } from '../search-params-wrapper';

// Mock useSearchParams
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('test=value'),
}));

// Test component that uses useSearchParams
function TestComponent() {
  return <div data-testid="test-component">Test Content</div>;
}

describe('SearchParamsWrapper', () => {
  it('renders children correctly', () => {
    render(
      <SearchParamsWrapper>
        <TestComponent />
      </SearchParamsWrapper>
    );
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  it('renders fallback while suspending', () => {
    // Mock Suspense behavior
    jest.spyOn(React, 'Suspense').mockImplementationOnce(({ fallback }) => {
      return <>{fallback}</>;
    });
    
    render(
      <SearchParamsWrapper fallback={<div data-testid="custom-fallback">Loading...</div>}>
        <TestComponent />
      </SearchParamsWrapper>
    );
    
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('uses default fallback when none provided', () => {
    // Mock Suspense behavior
    jest.spyOn(React, 'Suspense').mockImplementationOnce(({ fallback }) => {
      return <>{fallback}</>;
    });
    
    render(
      <SearchParamsWrapper>
        <TestComponent />
      </SearchParamsWrapper>
    );
    
    // Default fallback should be a div with animate-pulse class
    const fallback = screen.getByRole('generic');
    expect(fallback).toHaveClass('bg-muted');
    expect(fallback).toHaveClass('animate-pulse');
  });
});
