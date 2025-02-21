import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StripeConnectButton } from '../stripe-connect-button';
import { mockUseAuth } from '@/__mocks__/services/auth';
import { createMockUser } from '@/__mocks__/services/auth';
import { mockSupabaseClient } from '@/__mocks__/services/supabase';

// Mock the useAuth hook
jest.mock('@/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock the supabase client
jest.mock('@/lib/supabase', () => {
  const { mockSupabaseClient } = require('@/__mocks__/services/supabase');
  return {
    supabase: mockSupabaseClient
  };
});

// Mock the useToast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('StripeConnectButton', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Mock window.location
    delete window.location;
    window.location = { href: '' } as Location;
  });

  it('renders connect button when user is authenticated and not connected', () => {
    const mockUser = createMockUser();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    });

    render(<StripeConnectButton />);
    expect(screen.getByRole('button')).toHaveTextContent('Connect with Stripe');
  });

  it('renders disabled button when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });

    render(<StripeConnectButton />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Please sign in to connect Stripe');
  });

  it('renders disabled button when already connected to Stripe', () => {
    const mockUser = createMockUser();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    });

    render(<StripeConnectButton stripeAccountId="acct_123" />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Connected to Stripe');
  });

  it('shows loading state while connecting', async () => {
    const mockUser = createMockUser();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    });

    // Mock successful auth session
    mockSupabaseClient.auth.getSession.mockImplementationOnce(() => 
      Promise.resolve({ 
        data: { 
          session: { 
            access_token: 'test-token' 
          } 
        }, 
        error: null 
      })
    );

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://stripe.com/connect' })
      })
    ) as jest.Mock;

    render(<StripeConnectButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Connecting...');

    await waitFor(() => {
      expect(window.location.href).toBe('https://stripe.com/connect');
    });
  });

  it('handles connection error correctly', async () => {
    const mockUser = createMockUser();
    const mockToast = jest.fn();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    });

    // Mock useToast
    jest.mock('@/components/ui/use-toast', () => ({
      useToast: () => ({
        toast: mockToast
      })
    }));

    // Mock failed fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ 
          error: { 
            message: 'Connection failed',
            code: 'error_code'
          }
        })
      })
    ) as jest.Mock;

    render(<StripeConnectButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('Connect with Stripe');
    });
  });
});
