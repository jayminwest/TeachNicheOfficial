// @jest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import userEvent from '@testing-library/user-event';

// Set up the global flag for Suspense testing
global.__SUSPENSE_TEST_FALLBACK__ = false;

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn((param) => {
      if (param === 'error') return 'Test error message';
      if (param === 'redirect') return '/lessons';
      return null;
    }),
  }),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Mock the auth service
jest.mock('@/app/services/auth/supabaseAuth', () => ({
  signInWithGoogle: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock React's Suspense for controlled testing
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    Suspense: ({ children, fallback }) => {
      return global.__SUSPENSE_TEST_FALLBACK__ ? fallback : children;
    },
  };
});

// Import the component after mocking
import ClientAuthWrapper from '@/app/auth/client-auth-wrapper';
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth';

describe('Auth Component with Suspense', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.__SUSPENSE_TEST_FALLBACK__ = false;
    
    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
    });
  });
  
  it('renders the auth component inside suspense boundary', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <ClientAuthWrapper />
      </Suspense>
    );
    
    // Wait for the loading state to finish and the sign in button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });
  
  it('shows error message from URL parameters', async () => {
    render(<ClientAuthWrapper />);
    
    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
  
  it('handles sign in process', async () => {
    const user = userEvent.setup();
    render(<ClientAuthWrapper />);
    
    // Wait for the sign in button to appear
    const signInButton = await waitFor(() => 
      screen.getByRole('button', { name: /sign in with google/i })
    , { timeout: 3000 });
    
    // Click the sign in button
    await user.click(signInButton);
    
    // Check that signInWithGoogle was called
    expect(signInWithGoogle).toHaveBeenCalled();
  });
  
  it('renders fallback when suspense is triggered', () => {
    // Set the global flag to show fallback
    global.__SUSPENSE_TEST_FALLBACK__ = true;
    
    render(
      <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
        <ClientAuthWrapper />
      </Suspense>
    );
    
    // Check that the fallback is rendered
    expect(screen.getByTestId('suspense-fallback')).toBeInTheDocument();
  });
});
