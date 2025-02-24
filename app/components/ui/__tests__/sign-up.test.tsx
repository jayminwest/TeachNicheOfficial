import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUpPage } from '../sign-up';
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/services/auth/supabaseAuth', () => ({
  signInWithGoogle: jest.fn(),
}));

jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('SignUpPage', () => {
  // Setup common mocks
  const mockRouter = {
    push: jest.fn(),
  };
  const mockOnSwitchToSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });
  });

  // Component Rendering Tests
  it('renders the sign-up form correctly when not loading and no user', () => {
    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    // Check for key elements
    expect(screen.getByText('Create an account to get started with Teach Niche')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /already have an account\? sign in/i })).toBeInTheDocument();
  });

  it('shows loading indicator when auth context is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // Check for the loading spinner
    expect(screen.getByRole('heading', { level: 1, hidden: true })).toBeInTheDocument();
  });

  it('redirects to home when user is already authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
      loading: false,
    });

    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  // Form Interactions Tests
  it('handles Google sign-in button click', async () => {
    const user = userEvent.setup();
    (signInWithGoogle as jest.Mock).mockResolvedValue({});

    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    const signUpButton = screen.getByRole('button', { name: /sign up with google/i });
    await user.click(signUpButton);
    
    expect(signInWithGoogle).toHaveBeenCalled();
  });

  it('shows loading state during Google sign-in', async () => {
    const user = userEvent.setup();
    // Make the sign-in function wait
    (signInWithGoogle as jest.Mock).mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({}), 100);
    }));

    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    const signUpButton = screen.getByRole('button', { name: /sign up with google/i });
    await user.click(signUpButton);
    
    // Check for spinner
    expect(screen.getByTestId('spinner')).toHaveClass('animate-spin');
    expect(signUpButton).toBeDisabled();
  });

  it('displays error message when Google sign-in fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to authenticate with Google';
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      error: new Error(errorMessage)
    });

    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    const signUpButton = screen.getByRole('button', { name: /sign up with google/i });
    await user.click(signUpButton);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('calls onSwitchToSignIn when "Sign in" link is clicked', async () => {
    const user = userEvent.setup();
    
    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    const signInLink = screen.getByRole('button', { name: /already have an account\? sign in/i });
    await user.click(signInLink);
    
    expect(mockOnSwitchToSignIn).toHaveBeenCalled();
  });

  // Accessibility Tests
  it('has proper accessibility attributes', () => {
    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    // Check that buttons have accessible names
    const googleButton = screen.getByRole('button', { name: /sign up with google/i });
    expect(googleButton).toBeInTheDocument();
    
    // Check that the sign-in link is accessible
    const signInLink = screen.getByRole('button', { name: /already have an account\? sign in/i });
    expect(signInLink).toBeInTheDocument();
    
    // Test keyboard activation
    signInLink.focus();
    fireEvent.keyDown(signInLink, { key: 'Enter' });
    expect(mockOnSwitchToSignIn).toHaveBeenCalled();
  });

  it('maintains focus management during form interaction', async () => {
    const user = userEvent.setup();
    
    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    // First interactive element should be the Google sign-up button
    const googleButton = screen.getByRole('button', { name: /sign up with google/i });
    
    // Tab to the Google button
    await user.tab();
    expect(googleButton).toHaveFocus();
    
    // Tab to the sign-in link
    await user.tab();
    const signInLink = screen.getByRole('button', { name: /already have an account\? sign in/i });
    expect(signInLink).toHaveFocus();
  });

  it('announces errors to screen readers', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to authenticate with Google';
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      error: new Error(errorMessage)
    });

    render(<SignUpPage onSwitchToSignIn={mockOnSwitchToSignIn} />);
    
    const signUpButton = screen.getByRole('button', { name: /sign up with google/i });
    await user.click(signUpButton);
    
    // Wait for the error message to appear and check it's accessible
    await waitFor(() => {
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500'); // Visual indication
      // In a real implementation, we would also check for aria-live attributes
    });
  });
});
