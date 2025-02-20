import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { StripeConnectButton } from '@/components/ui/stripe-connect-button';
import { renderWithStripe } from '../../test-utils';
import { AuthContext } from '@/auth/AuthContext';

// Mock supabase outside describe block
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      })
    }
  }
}));

// Mock toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('StripeConnectButton', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = jest.fn();
    
    // Mock window.location
    delete window.location;
    window.location = { href: '' } as Location;
  });
  describe('rendering', () => {
    it('renders connect button when not connected', () => {
      renderWithStripe(
        <StripeConnectButton stripeAccountId={null} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent(/connect with stripe/i);
    });

    it('renders connected status when account exists', () => {
      renderWithStripe(
        <StripeConnectButton stripeAccountId="acct_test123" />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent(/connected to stripe/i);
    });

    it('shows loading state during connection', async () => {
      renderWithStripe(
        <StripeConnectButton stripeAccountId={null} />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('role', 'status');
        expect(button).toHaveTextContent(/connecting/i);
      });
    });
  });

  describe('interactions', () => {
    it('initiates oauth flow when clicked', async () => {
      const stripeUrl = 'https://connect.stripe.com/oauth/authorize?test=1';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: stripeUrl })
      });

      renderWithStripe(
        <StripeConnectButton stripeAccountId={null} />
      );
      
      const button = screen.getByRole('button');
      await act(async () => {
        await fireEvent.click(button);
      });

      expect(global.fetch).toHaveBeenCalled();
      expect(window.location.href).toBe(stripeUrl);
    });

    it('handles connection errors appropriately', async () => {
      const mockToast = jest.fn();
      jest.mock('@/components/ui/use-toast', () => ({
        useToast: () => ({
          toast: mockToast
        })
      }));

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Connection failed' })
      });

      renderWithStripe(
        <StripeConnectButton stripeAccountId={null} />
      );
      
      const button = screen.getByRole('button');
      await act(async () => {
        await fireEvent.click(button);
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Error',
          description: expect.stringContaining('Connection failed')
        })
      );
    });

    it('shows sign in message when user is not authenticated', () => {
      renderWithStripe(
        <AuthContext.Provider value={{ user: null, loading: false }}>
          <StripeConnectButton stripeAccountId={null} />
        </AuthContext.Provider>
      );
      
      expect(screen.getByText(/please sign in to connect stripe/i)).toBeInTheDocument();
    });

    it('handles country not supported error', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ 
          error: { 
            code: 'country_not_supported' 
          },
          supported_countries: ['US', 'UK']
        })
      });

      renderWithStripe(
        <StripeConnectButton stripeAccountId={null} />
      );
      
      const button = screen.getByRole('button');
      await act(async () => {
        await fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/stripe is not yet supported in your country/i)).toBeInTheDocument();
      });
    });

    it('handles missing redirect URL', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: null })
      });

      renderWithStripe(
        <StripeConnectButton stripeAccountId={null} />
      );
      
      const button = screen.getByRole('button');
      await act(async () => {
        await fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/no redirect url received from server/i)).toBeInTheDocument();
      });
    });
  });
});
