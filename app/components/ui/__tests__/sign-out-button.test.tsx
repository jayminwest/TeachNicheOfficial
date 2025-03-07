import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignOutButton } from '../sign-out-button';
import { signOut } from '@/app/services/auth/supabaseAuth';
import { useRouter } from 'next/navigation';

// Mock the signOut function
jest.mock('@/app/services/auth/supabaseAuth', () => ({
  signOut: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SignOutButton', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (signOut as jest.Mock).mockResolvedValue({
      success: true,
      error: null,
    });
  });
  
  it('renders correctly with default props', () => {
    render(<SignOutButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Sign out');
    expect(button).toHaveClass('bg-primary');
  });
  
  it('renders with custom className', () => {
    render(<SignOutButton className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
  
  it('renders with custom variant', () => {
    render(<SignOutButton variant="outline" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });
  
  it('shows loading state during sign out', async () => {
    // Make signOut take some time to resolve
    (signOut as jest.Mock).mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, error: null });
      }, 100);
    }));
    
    render(<SignOutButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Button should be in loading state
    expect(button).toBeDisabled();
    expect(screen.getByText('Signing out...')).toBeInTheDocument();
    
    // Wait for sign out to complete
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });
  
  it('redirects to home page on successful sign out', async () => {
    render(<SignOutButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Wait for sign out to complete
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
    
    // Should redirect to home page
    expect(mockPush).toHaveBeenCalledWith('/');
  });
  
  it('handles sign out errors', async () => {
    // Mock sign out failure
    (signOut as jest.Mock).mockResolvedValue({
      success: false,
      error: new Error('Sign out failed'),
    });
    
    render(<SignOutButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Wait for sign out to complete
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
    
    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled();
    
    // Should show error state
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('Error');
  });
});
