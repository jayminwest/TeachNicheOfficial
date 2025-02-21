import React from 'react';
import { screen, act } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { StripeConnectButton } from '../stripe-connect-button';
import { mockUseAuth, createMockUser, resetAuthMocks } from '@/__mocks__/services/auth';
import { mockSupabaseClient, createMockSession, resetSupabaseMocks } from '@/__mocks__/services/supabase';
import { createMockError } from '@/__mocks__/utils/mock-helpers';

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
  useAuth: () => mockUseAuth()
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
    resetAuthMocks();
    resetSupabaseMocks();
  });

  const renderStripeButton = (props: React.ComponentProps<typeof StripeConnectButton>) => {
    return render(<StripeConnectButton {...props} />);
  };

  it('renders connect button when not connected', () => {
    renderStripeButton({ stripeAccountId: null });
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/connect with stripe/i);
  });

  it('renders disabled button when already connected', () => {
    renderStripeButton({ stripeAccountId: "acct_123" });
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/connected to stripe/i);
  });

  it('renders sign in message when user is not authenticated', () => {
    mockUseAuth.mockReturnValueOnce({
      user: null,
      loading: false
    });

    renderStripeButton({ stripeAccountId: null });
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/please sign in/i);
  });

  it('shows loading state while connecting', async () => {
    const mockSession = createMockSession();
    jest.spyOn(mockSupabaseClient.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://stripe.com/connect' })
    });

    renderStripeButton({ stripeAccountId: null });

    const button = screen.getByRole('button');
    
    await act(async () => {
      await button.click();
    });

    expect(button).toHaveTextContent(/connecting/i);
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('handles API errors appropriately', async () => {
    // Spy on console.error to suppress the expected error log
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ 
        error: createMockError('Failed to connect with Stripe')
      })
    });

    renderStripeButton({ stripeAccountId: null });
    
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
    jest.spyOn(mockSupabaseClient.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null
    });

    renderStripeButton({ stripeAccountId: null });
    
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
    jest.spyOn(mockSupabaseClient.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: new Error('Failed to get session')
    });

    renderStripeButton({ stripeAccountId: null });
    
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

  it('handles country not supported error appropriately', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    };
    
    jest.spyOn(mockSupabaseClient.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ 
        error: { 
          code: 'country_not_supported',
          message: 'Sorry, Stripe is not yet supported in your country'
        },
        supported_countries: ['US', 'GB', 'CA']
      })
    });

    renderStripeButton({ stripeAccountId: null });
    
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
    
    jest.spyOn(mockSupabaseClient.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}) // Empty response with no URL
    });

    renderStripeButton({ stripeAccountId: null });
    
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
    
    jest.spyOn(mockSupabaseClient.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    // Mock navigator.language
    const originalLanguage = navigator.language;
    Object.defineProperty(navigator, 'language', {
      value: 'fr-FR',
      configurable: true
    });

    renderStripeButton({ stripeAccountId: null });
    
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
