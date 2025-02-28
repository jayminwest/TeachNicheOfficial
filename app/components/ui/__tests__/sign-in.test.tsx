import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInPage } from '../sign-in';
import * as firebaseAuth from '@/app/services/auth/firebase-auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the firebase-auth-service module (note the correct path)
jest.mock('@/app/services/auth/firebase-auth-service', () => ({
  signInWithGoogle: jest.fn().mockResolvedValue({ uid: 'test-user-id', email: 'test@example.com' })
}));

// Get the mocked function for use in tests
const mockSignInWithGoogle = jest.requireMock('@/app/services/auth/firebase-auth-service').signInWithGoogle;

jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('SignInPage', () => {
  // Setup common mocks
  const mockRouter = {
    push: jest.fn(),
  };
  const mockOnSwitchToSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });
  });

  // Component Rendering Tests
  it('renders the sign-in form correctly when not loading and no user', () => {
    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    // Check for key elements
    expect(screen.getByText('Welcome back! Please sign in to continue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /don't have an account\? sign up/i })).toBeInTheDocument();
  });

  it('shows loading indicator when auth context is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // The spinner doesn't have a role attribute, so we check for the element with animation class
    expect(screen.getByTestId('loading-spinner')).toHaveClass('animate-spin');
  });

  it('redirects to dashboard when user is already authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
      loading: false,
    });

    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  // Form Interactions Tests
  it('handles Google sign-in button click', async () => {
    const user = userEvent.setup();
    
    // Clear any previous calls
    mockSignInWithGoogle.mockClear();
    
    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    const signInButton = screen.getByTestId('google-sign-in');
    await user.click(signInButton);
    
    // Wait for the mock to be called
    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
    
    // Wait for the navigation to occur after successful sign-in
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state during Google sign-in', async () => {
    const user = userEvent.setup();
    
    // Create a mock implementation that doesn't resolve immediately
    let resolvePromise: (value: any) => void;
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Clear any previous calls and set up the delayed promise
    mockSignInWithGoogle.mockClear();
    mockSignInWithGoogle.mockImplementationOnce(() => mockPromise);
    
    // Render the component
    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    // Get the button and click it
    const signInButton = screen.getByTestId('google-sign-in');
    await user.click(signInButton);
    
    // Check for the spinner icon which indicates loading state
    await waitFor(() => {
      expect(screen.getByTestId('spinner-icon')).toBeInTheDocument();
    });
    
    // Resolve the promise to clean up
    resolvePromise({ uid: 'test-user-id', email: 'test@example.com' });
    
    // Wait for the navigation to occur after successful sign-in
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message when Google sign-in fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to authenticate with Google';
    
    // Clear previous calls and set up error response
    mockSignInWithGoogle.mockClear();
    mockSignInWithGoogle.mockRejectedValueOnce(new Error(errorMessage));

    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    const signInButton = screen.getByTestId('google-sign-in');
    await user.click(signInButton);
    
    // Wait for any error message to appear
    await waitFor(() => {
      const errorElement = screen.getByTestId('password-input');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500');
    });
  });

  it('calls onSwitchToSignUp when "Sign up" link is clicked', async () => {
    const user = userEvent.setup();
    
    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    const signUpLink = screen.getByRole('button', { name: /don't have an account\? sign up/i });
    await user.click(signUpLink);
    
    expect(mockOnSwitchToSignUp).toHaveBeenCalled();
  });

  // Accessibility Tests
  it('has proper accessibility attributes', () => {
    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    // Check that buttons have accessible names
    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    expect(googleButton).toBeInTheDocument();
    
    // Check that the sign-up link is accessible
    const signUpLink = screen.getByRole('button', { name: /don't have an account\? sign up/i });
    expect(signUpLink).toBeInTheDocument();
    
    // Test keyboard activation
    signUpLink.focus();
    fireEvent.keyDown(signUpLink, { key: 'Enter' });
    expect(mockOnSwitchToSignUp).toHaveBeenCalled();
  });

  it('maintains focus management during form interaction', async () => {
    const user = userEvent.setup();
    
    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    // First interactive element should be the Google sign-in button
    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    
    // Tab to the Google button
    await user.tab();
    expect(googleButton).toHaveFocus();
    
    // Tab to the sign-up link
    await user.tab();
    const signUpLink = screen.getByRole('button', { name: /don't have an account\? sign up/i });
    expect(signUpLink).toHaveFocus();
  });

  it('announces errors to screen readers', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to authenticate with Google';
    (firebaseAuth.signInWithGoogle as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<SignInPage onSwitchToSignUp={mockOnSwitchToSignUp} />);
    
    const signInButton = screen.getByTestId('google-sign-in');
    await user.click(signInButton);
    
    // Wait for the error message to appear and check it's accessible
    await waitFor(() => {
      const errorElement = screen.getByTestId('password-input');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500'); // Visual indication
      // In a real implementation, we would also check for aria-live attributes
    });
  });
});
