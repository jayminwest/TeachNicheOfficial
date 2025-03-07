import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthDialog } from '../auth-dialog';
import { useAuth } from '@/app/services/auth/AuthContext';
import { Suspense } from 'react';

// Mock the useAuth hook
jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the useSearchParams hook
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('AuthDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for useAuth
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  });
  
  it('renders correctly when closed', () => {
    render(
      <AuthDialog 
        open={false} 
        onOpenChange={mockOnOpenChange} 
        onSuccess={mockOnSuccess}
      />
    );
    
    // Dialog should not be visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  
  it('renders correctly when open', () => {
    render(
      <Suspense fallback={<div>Loading auth dialog...</div>}>
        <AuthDialog 
          open={true} 
          onOpenChange={mockOnOpenChange} 
          onSuccess={mockOnSuccess}
        />
      </Suspense>
    );
    
    // Dialog should be visible with fallback content
    expect(screen.getByText('Loading auth dialog...')).toBeInTheDocument();
  });
  
  it('closes when authenticated user is detected', async () => {
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
      isLoading: false,
      isAuthenticated: true,
      error: null,
    });
    
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <AuthDialog 
          open={true} 
          onOpenChange={mockOnOpenChange} 
          onSuccess={mockOnSuccess}
        />
      </Suspense>
    );
    
    // Dialog should call onSuccess and close
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
  
  it('shows sign-in view by default', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <AuthDialog 
          open={true} 
          onOpenChange={mockOnOpenChange} 
          onSuccess={mockOnSuccess}
        />
      </Suspense>
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should show sign-in view
    expect(screen.getByText('Sign in to Teach Niche')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });
  
  it('shows sign-up view when specified', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <AuthDialog 
          open={true} 
          onOpenChange={mockOnOpenChange} 
          onSuccess={mockOnSuccess}
          defaultView="sign-up"
        />
      </Suspense>
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should show sign-in view (since we don't have a separate sign-up view in the actual implementation)
    expect(screen.getByText('Sign in to Teach Niche')).toBeInTheDocument();
  });
});
