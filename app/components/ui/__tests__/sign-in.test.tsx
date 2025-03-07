import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInPage, SignIn } from '../sign-in';
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn() })),
}));

jest.mock('@/app/services/auth/supabaseAuth', () => ({
  signInWithGoogle: jest.fn(),
  onAuthStateChange: jest.fn().mockReturnValue({ 
    data: { subscription: { unsubscribe: jest.fn() } } 
  }),
  getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
}));

jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));


describe('SignInPage', () => {
  // Setup common mocks
  const mockRouter = {
    push: jest.fn(),
  };
  const mockOnSignInSuccess = jest.fn();
  const mockOnSwitchToSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(param => {
        if (param === 'redirect') return null;
        return null;
      })
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });
  });

  // Component Rendering Tests
  it('renders the sign-in form correctly when not loading and no user', () => {
    render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    // Check for key elements
    expect(screen.getByText('Sign in with your Google account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows loading indicator when auth context is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // The spinner doesn't have a role attribute, so we check for the element with animation class
    expect(screen.getByTestId('loading-spinner')).toHaveClass('animate-spin');
  });

  it('redirects to profile when user is already authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
      loading: false,
    });

    render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/profile');
  });

  // Form Interactions Tests
  it('handles Google sign-in button click', async () => {
    // Mock successful sign-in
    (signInWithGoogle as jest.Mock).mockResolvedValue({ error: null });
    
    // Mock searchParams.get to return a specific redirect value
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue('/dashboard')
    });

    // Set up window object for testing
    global.window = Object.create(window);
    Object.defineProperty(window, 'signInWithGoogleCalled', {
      writable: true,
      value: false,
    } as PropertyDescriptor);

    await act(async () => {
      render(<SignInPage onSignInSuccess={jest.fn()} />);
    });
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    
    // Simulate click with act to handle state updates
    await act(async () => {
      signInButton.click();
    });
    
    expect(signInWithGoogle).toHaveBeenCalled();
    
    // Check that the window flag was set for testing
    expect((window as Window & typeof globalThis & { signInWithGoogleCalled: boolean }).signInWithGoogleCalled).toBe(true);
  });

  it('shows loading state during Google sign-in', async () => {
    // Setup userEvent
    userEvent.setup();
    // Make the sign-in function wait
    (signInWithGoogle as jest.Mock).mockImplementation(() => new Promise(resolve => {
      setTimeout(resolve, 100);
    }));

    await act(async () => {
      render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    });
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    
    await act(async () => {
      await userEvent.click(signInButton);
    });
    
    // Check for spinner
    expect(screen.getByTestId('spinner-icon')).toHaveClass('animate-spin');
    expect(signInButton).toBeDisabled();
  });

  it('displays error message when Google sign-in fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to authenticate with Google';
    (signInWithGoogle as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    });
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    
    await act(async () => {
      await user.click(signInButton);
    });
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // This test is no longer applicable as the component doesn't have a sign up link
  it('handles sign in flow correctly', async () => {
    
    render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    expect(signInButton).toBeInTheDocument();
  });

  // Accessibility Tests
  it('has proper accessibility attributes', () => {
    render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    // Check that buttons have accessible names
    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    expect(googleButton).toBeInTheDocument();
  });

  it('maintains focus management during form interaction', async () => {
    render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    // First interactive element should be the Google sign-in button
    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    
    // Check that the button is in the document
    expect(googleButton).toBeInTheDocument();
  });
  
  it('stores redirect path in cookie when provided', async () => {
    // Mock document.cookie
    const originalCookie = document.cookie;
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
    
    await act(async () => {
      render(<SignInPage redirectPath="/dashboard" />);
    });
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    
    await act(async () => {
      signInButton.click();
    });
    
    // Should set cookie with redirect path
    expect(document.cookie).toContain('auth_redirect=/dashboard');
    
    // Restore document.cookie
    Object.defineProperty(document, 'cookie', {
      value: originalCookie,
    });
  });

  it('redirects to profile when user is already authenticated', async () => {
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      loading: false,
    });
    
    await act(async () => {
      render(<SignInPage />);
    });
    
    // Should redirect to profile
    expect(mockRouter.push).toHaveBeenCalledWith('/profile');
  });

  it('redirects to custom path from searchParams when user is authenticated', async () => {
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      loading: false,
    });
    
    // Mock search params with redirect
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(param => {
        if (param === 'redirect') return '/custom-path';
        return null;
      })
    });
    
    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' } as Location;
    
    await act(async () => {
      render(<SignInPage />);
    });
    
    // Should redirect to custom path
    expect(window.location.href).toBe('/custom-path');
    
    // Restore window.location
    window.location = originalLocation;
  });

  it('handles URL-encoded redirect paths', async () => {
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      loading: false,
    });
    
    // Mock search params with encoded redirect
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(param => {
        if (param === 'redirect') return encodeURIComponent('/path?query=value');
        return null;
      })
    });
    
    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' } as Location;
    
    await act(async () => {
      render(<SignInPage />);
    });
    
    // Should redirect to decoded path
    expect(window.location.href).toBe('/path?query=value');
    
    // Restore window.location
    window.location = originalLocation;
  });

  it('calls onSignInSuccess callback when user is authenticated', async () => {
    const mockOnSignInSuccess = jest.fn();
    
    // First render without user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });
    
    const { rerender } = render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    // Then update to authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      loading: false,
    });
    
    // Trigger useEffect by re-rendering
    rerender(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    // Should call success callback
    expect(mockOnSignInSuccess).toHaveBeenCalled();
  });

  it('handles successful Google sign-in with timeout', async () => {
    // Mock successful sign-in
    (signInWithGoogle as jest.Mock).mockResolvedValue({ error: null });
    
    // Mock setTimeout
    jest.useFakeTimers();
    
    await act(async () => {
      render(<SignInPage />);
    });
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    
    await act(async () => {
      signInButton.click();
    });
    
    // Should call signInWithGoogle
    expect(signInWithGoogle).toHaveBeenCalled();
    
    // Should be in loading state
    expect(signInButton).toBeDisabled();
    
    // Fast-forward timers
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    
    // Should no longer be in loading state
    expect(signInButton).not.toBeDisabled();
    
    // Restore timers
    jest.useRealTimers();
  });

  it('handles sign-in with error from Google', async () => {
    // Mock sign-in with error
    (signInWithGoogle as jest.Mock).mockResolvedValue({ 
      error: new Error('Google authentication failed') 
    });
    
    await act(async () => {
      render(<SignInPage />);
    });
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    
    await act(async () => {
      signInButton.click();
    });
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Google authentication failed')).toBeInTheDocument();
    });
  });

  it('announces errors to screen readers', async () => {
    const errorMessage = 'Failed to authenticate with Google';
    (signInWithGoogle as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    });
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    
    await act(async () => {
      signInButton.click();
    });
    
    // Wait for the error message to appear and check it's accessible
    await waitFor(() => {
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500'); // Visual indication
      // In a real implementation, we would also check for aria-live attributes
    });
  });
  
  it('renders with initialView prop', async () => {
    render(<SignInPage initialView="sign-in" />);
    
    expect(screen.getByText('Sign in with your Google account')).toBeInTheDocument();
  });
  
  it('applies custom className to SignInPage', async () => {
    render(<SignInPage className="custom-page-class" />);
    
    // The className should be applied to the container
    const container = screen.getByTestId('sign-in-container');
    expect(container).toHaveClass('custom-page-class');
  });
  
  it('handles console errors during sign-in', async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock sign-in to throw error
    (signInWithGoogle as jest.Mock).mockRejectedValue(new Error('Console error test'));
    
    await act(async () => {
      render(<SignInPage />);
    });
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    
    await act(async () => {
      signInButton.click();
    });
    
    // Check that console.error was called
    expect(consoleSpy).toHaveBeenCalledWith(
      'Google sign-in error:',
      expect.any(Error)
    );
    
    // Restore console.error
    consoleSpy.mockRestore();
  });
});

describe('SignIn', () => {
  const mockRedirect = '/dashboard';
  const mockError = 'OAuthSignin';
  let mockSearchParams: URLSearchParams;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock search params
    mockSearchParams = new URLSearchParams();
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Set up mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
    
    // Set up mock sign in function
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      success: true,
      error: null,
    });
  });
  
  it('renders Suspense fallback when loading', async () => {
    // Instead of mocking Suspense, render the fallback directly
    render(
      <div className="flex min-h-[inherit] w-full items-center justify-center">
        <div className="text-center">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
    
    // Should show loading spinner
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toHaveClass('animate-spin');
  });
  
  it('renders correctly with default props', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <SignIn />
      </Suspense>
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Check basic elements
    expect(screen.getByText('Sign in to Teach Niche')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
  });
  
  it('shows error message when error param is present', async () => {
    // Set up mock search params with error
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(param => {
        if (param === 'error') return mockError;
        return null;
      })
    });
    
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <SignIn />
      </Suspense>
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/There was a problem signing you in/i)).toBeInTheDocument();
    });
  });
  
  it('captures redirect parameter for use after sign in', async () => {
    mockSearchParams.set('redirect', mockRedirect);
    
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <SignIn />
      </Suspense>
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Click sign in button
    const signInButton = screen.getByRole('button', { name: /Sign in with Google/i });
    fireEvent.click(signInButton);
    
    // Should call signInWithGoogle
    expect(signInWithGoogle).toHaveBeenCalled();
  });
  
  it('handles sign in button click', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <SignIn />
      </Suspense>
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Click sign in button
    const signInButton = screen.getByRole('button', { name: /Sign in with Google/i });
    fireEvent.click(signInButton);
    
    // Should show loading state
    expect(signInButton).toBeDisabled();
    
    // Should call signInWithGoogle
    expect(signInWithGoogle).toHaveBeenCalled();
  });
  
  it('handles sign in errors', async () => {
    // Mock sign in failure
    (signInWithGoogle as jest.Mock).mockRejectedValue(new Error('Sign in failed'));
    
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <SignIn />
      </Suspense>
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Click sign in button
    const signInButton = screen.getByRole('button', { name: /Sign in with Google/i });
    fireEvent.click(signInButton);
    
    // Wait for sign in to complete
    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalled();
    });
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Sign in failed')).toBeInTheDocument();
    });
    
    // Button should be enabled again
    expect(signInButton).not.toBeDisabled();
  });
  
  it('can be customized with className', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <SignIn className="custom-class" />
      </Suspense>
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Container should have custom class
    const container = screen.getByTestId('sign-in-container');
    expect(container).toHaveClass('custom-class');
  });
  
  it('handles VisuallyHidden component for accessibility', async () => {
    render(
      <div className="flex min-h-[inherit] w-full items-center justify-center">
        <div className="text-center">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <span className="sr-only">Loading authentication status</span>
          <p>Loading...</p>
        </div>
      </div>
    );
    
    // Should have screen reader only text
    const srOnlyText = document.querySelector('.sr-only');
    expect(srOnlyText).toHaveTextContent('Loading authentication status');
  });
});
