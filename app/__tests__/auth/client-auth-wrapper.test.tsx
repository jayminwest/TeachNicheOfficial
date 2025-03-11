import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientAuthWrapper from '@/app/auth/client-auth-wrapper';
import { signInWithGoogle } from '@/app/services/auth/supabaseAuth';
import { useSearchParams, useRouter } from 'next/navigation';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock the auth service
jest.mock('@/app/services/auth/supabaseAuth', () => ({
  signInWithGoogle: jest.fn(),
}));

describe('ClientAuthWrapper', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  // Setup for each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the router
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock the search params with no parameters by default
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
    });
    
    // Mock the sign in function to succeed by default
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      success: true,
      error: null,
      data: {}
    });
    
    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true
    });
  });
  
  it('renders loading state initially', () => {
    render(<ClientAuthWrapper />);
    
    // Should show loading spinner initially
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });
  
  it('renders sign in button after loading', async () => {
    render(<ClientAuthWrapper />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    });
  });
  
  it('handles error from URL parameters', async () => {
    // Mock search params with error
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => param === 'error' ? 'Authentication%20failed' : null,
    });
    
    render(<ClientAuthWrapper />);
    
    // Wait for loading to finish and check for error message
    await waitFor(() => {
      const errorElements = screen.getAllByText(/Authentication failed/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });
  
  it('stores redirect URL from parameters', async () => {
    // Mock search params with redirect
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => param === 'redirect' ? '/lessons' : null,
    });
    
    render(<ClientAuthWrapper />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('auth-redirect', '/lessons');
    });
  });
  
  it('handles Google sign in success with redirect', async () => {
    // Mock sessionStorage to return a redirect URL
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue('/dashboard');
    
    render(<ClientAuthWrapper />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    });
    
    // Click the sign in button
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    
    // Wait for sign in to complete
    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalled();
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('auth-redirect');
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  it('handles Google sign in success without redirect', async () => {
    // Mock sessionStorage to return null for redirect URL
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
    
    render(<ClientAuthWrapper />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    });
    
    // Click the sign in button
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    
    // Wait for sign in to complete
    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });
  
  it('handles Google sign in failure', async () => {
    // Mock sign in to fail
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      success: false,
      error: new Error('Failed to authenticate'),
      data: null
    });
    
    render(<ClientAuthWrapper />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    });
    
    // Click the sign in button
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to authenticate')).toBeInTheDocument();
    });
    
    // Router should not be called on error
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
