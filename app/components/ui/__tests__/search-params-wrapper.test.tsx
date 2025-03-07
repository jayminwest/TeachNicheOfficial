import React from 'react';
import { render, screen } from '@testing-library/react';
import { SearchParamsWrapper } from '../search-params-wrapper';

// Mock useSearchParams
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('test=value'),
}));

// Mock React.Suspense to test fallback rendering
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    Suspense: ({ children, fallback }) => {
      // For testing purposes, we can control which gets rendered
      return process.env.TEST_SUSPENSE_FALLBACK === 'true' 
        ? fallback 
        : children;
    }
  };
});

// Test component that uses useSearchParams
function TestComponent() {
  return <div data-testid="test-component">Test Content</div>;
}

describe('SearchParamsWrapper', () => {
  beforeEach(() => {
    process.env.TEST_SUSPENSE_FALLBACK = 'false';
  });

  afterEach(() => {
    delete process.env.TEST_SUSPENSE_FALLBACK;
  });

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
    // Set environment to render fallback
    process.env.TEST_SUSPENSE_FALLBACK = 'true';
    
    render(
      <SearchParamsWrapper fallback={<div data-testid="custom-fallback">Loading...</div>}>
        <TestComponent />
      </SearchParamsWrapper>
    );
    
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('uses default fallback when none provided', () => {
    // Set environment to render fallback
    process.env.TEST_SUSPENSE_FALLBACK = 'true';
    
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
