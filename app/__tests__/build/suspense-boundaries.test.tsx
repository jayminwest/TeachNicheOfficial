import { render } from '@testing-library/react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Test component that uses useSearchParams
function TestComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const handleClick = () => {
    const query = searchParams?.get('q') || '';
    router.push(`/search?q=${query}`);
  };
  
  return (
    <div>
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
      <Suspense fallback={<div>Loading...</div>}>
        <TestComponent />
      </Suspense>
    </div>
  );
}

describe('Build Process with Suspense Boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the search params and router
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => param === 'q' ? 'test-query' : null,
    });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });
  
  it('renders client components with useSearchParams inside suspense boundaries', () => {
    const { container } = render(<ServerComponent />);
    
    // The component should render without errors
    expect(container.textContent).toContain('Server Component');
    expect(container.textContent).toContain('Query: test-query');
  });
  
  it('handles suspense correctly when useSearchParams is used', () => {
    // Mock useSearchParams to trigger suspense
    (useSearchParams as jest.Mock).mockImplementation(() => {
      throw new Promise(() => {}); // This simulates suspense
    });
    
    const { container } = render(<ServerComponent />);
    
    // The fallback should be rendered
    expect(container.textContent).toContain('Loading...');
    expect(container.textContent).not.toContain('Query:');
  });
});
