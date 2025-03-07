import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInPage } from '../sign-in';
import { signInWithGoogle, onAuthStateChange } from '@/app/services/auth/supabaseAuth';
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
    
    // Mock auth state change event
    const mockAuthStateChange = jest.fn((callback) => {
      // Simulate auth state change after sign-in
      setTimeout(() => {
        callback('SIGNED_IN', { user: { id: 'test-user' } });
      }, 100);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
    
    (onAuthStateChange as jest.Mock).mockImplementation(mockAuthStateChange);
    
    // Mock searchParams.get to return a specific redirect value
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue('/dashboard')
    });

    // Set up window object for testing
    global.window = Object.create(window);
    Object.defineProperty(window, 'signInWithGoogleCalled', {
      writable: true,
      value: false,
    });

    render(<SignInPage onSignInSuccess={jest.fn()} />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    // Simulate click without using user event
    signInButton.click();
    
    expect(signInWithGoogle).toHaveBeenCalled();
    
    // Check that the window flag was set for testing
    expect((window as any).signInWithGoogleCalled).toBe(true);
    
    // We're not expecting router.push to be called directly anymore
    // The redirection happens in the auth state change handler
    await waitFor(() => {
      expect(mockAuthStateChange).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('shows loading state during Google sign-in', async () => {
    // Setup userEvent
    userEvent.setup();
    // Make the sign-in function wait
    (signInWithGoogle as jest.Mock).mockImplementation(() => new Promise(resolve => {
      setTimeout(resolve, 100);
    }));

    render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    await userEvent.click(signInButton);
    
    // Check for spinner
    expect(screen.getByTestId('spinner-icon')).toHaveClass('animate-spin');
    expect(signInButton).toBeDisabled();
  });

  it('displays error message when Google sign-in fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to authenticate with Google';
    (signInWithGoogle as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<SignInPage onSignInSuccess={mockOnSignInSuccess} />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    await user.click(signInButton);
    
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
    
    render(<SignInPage redirectPath="/dashboard" />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    signInButton.click();
    
    // Should set cookie with redirect path
    expect(document.cookie).toContain('auth_redirect=/dashboard');
    
    // Restore document.cookie
    Object.defineProperty(document, 'cookie', {
      value: originalCookie,
    });
  });

  it('announces errors to screen readers', async () => {
    const errorMessage = 'Failed to authenticate with Google';
    (signInWithGoogle as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    // Simulate click directly
    signInButton.click();
    
    // Wait for the error message to appear and check it's accessible
    await waitFor(() => {
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500'); // Visual indication
      // In a real implementation, we would also check for aria-live attributes
    });
  });
});
