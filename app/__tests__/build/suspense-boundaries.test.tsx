import { render } from '@testing-library/react';
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

// Import the mocked hooks after mocking
const { useSearchParams, useRouter } = require('next/navigation');

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

// Test component that uses useSearchParams
function TestComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const handleClick = () => {
    const query = searchParams?.get('q') || '';
    router.push(`/search?q=${query}`);
  };
  
  return (
    <div data-testid="test-component">
      <button onClick={handleClick}>Search</button>
      <p>Query: {searchParams?.get('q') || 'none'}</p>
    </div>
  );
}

// Server component that uses the client component with Suspense
function ServerComponent() {
  return (
    <div>
      <h1>Server Component</h1>
      <Suspense fallback={<div data-testid="loading-fallback">Loading...</div>}>
        <TestComponent />
      </Suspense>
    </div>
  );
}

describe('Build Process with Suspense Boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the global flag
    global.__SUSPENSE_TEST_FALLBACK__ = false;
  });
  
  it('renders client components with useSearchParams inside suspense boundaries', () => {
    const { container } = render(<ServerComponent />);
    
    // The component should render without errors
    expect(container.textContent).toContain('Server Component');
    expect(container.textContent).toContain('Query: test-query');
  });
  
  it('handles suspense correctly when useSearchParams is used', () => {
    // Set the global flag to show fallback
    global.__SUSPENSE_TEST_FALLBACK__ = true;
    
    const { container } = render(<ServerComponent />);
    
    // The fallback should be rendered
    expect(container.textContent).toContain('Loading...');
    expect(container.textContent).not.toContain('Query: test-query');
  });
});
