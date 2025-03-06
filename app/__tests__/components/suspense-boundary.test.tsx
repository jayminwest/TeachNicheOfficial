import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';

// Mock the next/navigation hooks before importing components that use them
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn((param) => param === 'q' ? 'test-query' : null),
  }),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Import the mocked useSearchParams after mocking
const { useSearchParams } = require('next/navigation');

// Mock React's Suspense for controlled testing
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    Suspense: ({ children, fallback }) => {
      // For testing purposes, we'll render either children or fallback
      // based on a global flag that we can control in tests
      return global.__SUSPENSE_TEST_FALLBACK__ ? fallback : children;
    },
  };
});

// Component that uses useSearchParams
function SearchParamsComponent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || 'default';
  return <div data-testid="search-params-component">Query: {query}</div>;
}

// Component that wraps SearchParamsComponent in Suspense
function SuspenseWrapper() {
  return (
    <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
      <SearchParamsComponent />
    </Suspense>
  );
}

describe('Suspense Boundary with useSearchParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the global flag
    global.__SUSPENSE_TEST_FALLBACK__ = false;
  });
  
  it('renders the component with search params inside suspense boundary', () => {
    render(<SuspenseWrapper />);
    
    // The component should be rendered with the query parameter
    expect(screen.getByTestId('search-params-component')).toBeInTheDocument();
    expect(screen.getByText('Query: test-query')).toBeInTheDocument();
  });
  
  it('handles suspense fallback when needed', () => {
    // Set the global flag to show fallback
    global.__SUSPENSE_TEST_FALLBACK__ = true;
    
    render(<SuspenseWrapper />);
    
    // The fallback should be rendered
    expect(screen.getByTestId('suspense-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('search-params-component')).not.toBeInTheDocument();
  });
});
