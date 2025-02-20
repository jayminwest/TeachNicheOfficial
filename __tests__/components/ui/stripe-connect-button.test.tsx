import { screen, act } from '@testing-library/react';
import { StripeConnectButton } from '@/components/ui/stripe-connect-button';
import { renderWithStripe } from '../../test-utils';
import { AuthContext } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';

// Mock fetch
global.fetch = jest.fn();

// Mock toast
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

const mockUseAuth = jest.fn().mockReturnValue({
  user: { id: 'test-user-id', email: 'test@example.com' },
  loading: false
});

jest.mock('@/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

describe('StripeConnectButton', () => {
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
      expires_in: 3600
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
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/connecting/i);
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
