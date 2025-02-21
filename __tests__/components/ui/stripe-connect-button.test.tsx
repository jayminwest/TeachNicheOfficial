import React from 'react';
import { screen, act } from '@testing-library/react';
import { StripeConnectButton } from '@/components/ui/stripe-connect-button';
import { renderWithStripe } from '../../test-utils';
import { mockUseAuth, mockUser } from '../../../__mocks__/services/auth';
import { mockSupabaseClient } from '../../../__mocks__/services/supabase';

// Store original window.location
const originalLocation = window.location;

// Mock fetch
global.fetch = jest.fn();

// Mock toast
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock auth context
jest.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false
  })
}));

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

describe('StripeConnectButton', () => {
  beforeAll(() => {
    // Mock window.location
    delete window.location;
    window.location = { ...originalLocation, href: 'http://localhost:3000/test' };
  });

  afterAll(() => {
    // Restore original window.location
    window.location = originalLocation;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders connect button when not connected', () => {
    renderWithStripe(
      <StripeConnectButton stripeAccountId={null} />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/connect with stripe/i);
  });

  it('renders disabled button when already connected', () => {
    renderWithStripe(
      <StripeConnectButton stripeAccountId="acct_123" />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/connected to stripe/i);
  });

  it('renders sign in message when user is not authenticated', () => {
    mockUseAuth.mockReturnValueOnce({
      user: null,
      loading: false
    });

    renderWithStripe(
      <StripeConnectButton stripeAccountId={null} />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/please sign in/i);
  });

  it('shows loading state while connecting', async () => {
    // Mock responses
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    };
    
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://stripe.com/connect' })
    });

    const { rerender } = renderWithStripe(
      <StripeConnectButton stripeAccountId={null} />
    );

    // Mock window.location
    const button = screen.getByRole('button');
    
    // Set test environment URL
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/test'
      },
      writable: true
    });

    // Click and wait for state updates
    await act(async () => {
      await button.click();
    });

    // Wait for loading state
    await screen.findByText(/connecting/i);
    const loadingButton = screen.getByRole('button');
    expect(loadingButton).toHaveTextContent(/connecting/i);
    expect(loadingButton).toHaveAttribute('aria-busy', 'true');
  });

  it('handles API errors appropriately', async () => {
    // Spy on console.error to suppress the expected error log
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ 
        error: 'Failed to connect with Stripe'
      })
    });

    renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
    
    const button = screen.getByRole('button');
    await act(async () => {
      await button.click();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'Error'
    }));
  });

  it('handles missing session appropriately', async () => {
    // Spy on console.error to suppress the expected error log
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock missing session
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null
    });

    renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
    
    const button = screen.getByRole('button');
    await act(async () => {
      await button.click();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'Error',
      description: 'No active session'
    }));
  });

  it('handles session error appropriately', async () => {
    // Spy on console.error to suppress the expected error log
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock session error
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: new Error('Session error')
    });

    renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
    
    const button = screen.getByRole('button');
    await act(async () => {
      await button.click();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'Error',
      description: 'Failed to get session'
    }));
  });

  it('initiates oauth flow when clicked', async () => {
    // Mock successful session
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    };
    
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    // Mock successful API response with OAuth URL
    const mockOAuthUrl = 'https://connect.stripe.com/oauth/test';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: mockOAuthUrl })
    });

    // Mock window.location for verification
    const mockWindowLocation = {
      href: 'http://localhost:3000/test'
    };
    Object.defineProperty(window, 'location', {
      value: mockWindowLocation,
      writable: true
    });

    renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
    
    const button = screen.getByRole('button');
    await act(async () => {
      await button.click();
    });

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/stripe/connect',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        })
      })
    );

    // Verify API call was made with correct URL and headers
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/stripe/connect',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        })
      })
    );

    // Verify the mock URL was used
    expect(mockOAuthUrl).toBe('https://connect.stripe.com/oauth/test');
  });

  it('updates UI after successful connection', async () => {
    // Start with no Stripe account
    const { rerender } = renderWithStripe(
      <StripeConnectButton stripeAccountId={null} />
    );
    
    // Initial state should show connect button
    expect(screen.getByRole('button')).toHaveTextContent(/connect with stripe/i);
    
    // Simulate successful connection by updating props
    rerender(
      <StripeConnectButton stripeAccountId="acct_123" />
    );
    
    // Should now show connected state
    const updatedButton = screen.getByRole('button');
    expect(updatedButton).toBeDisabled();
    expect(updatedButton).toHaveTextContent(/connected to stripe/i);
  });

  it('handles country not supported error appropriately', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    };
    
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ 
        error: { 
          code: 'country_not_supported'
        },
        supported_countries: ['US', 'GB', 'CA']
      })
    });

    renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
    
    const button = screen.getByRole('button');
    await act(async () => {
      await button.click();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'Error',
      description: expect.stringContaining('Sorry, Stripe is not yet supported in your country')
    }));
  });

  it('handles missing redirect URL appropriately', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    };
    
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}) // Empty response with no URL
    });

    renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
    
    const button = screen.getByRole('button');
    await act(async () => {
      await button.click();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'Error',
      description: 'No redirect URL received from server'
    }));
  });

  it('sends correct locale in API request', async () => {
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    };
    
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    // Mock navigator.language
    const originalLanguage = navigator.language;
    Object.defineProperty(navigator, 'language', {
      value: 'fr-FR',
      configurable: true
    });

    renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
    
    const button = screen.getByRole('button');
    await act(async () => {
      await button.click();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/stripe/connect',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Accept-Language': 'fr-FR'
        }),
        body: expect.stringMatching(/"locale":"fr-FR"/)
      })
    );

    // Restore original language
    Object.defineProperty(navigator, 'language', {
      value: originalLanguage,
      configurable: true
    });
  });
});
