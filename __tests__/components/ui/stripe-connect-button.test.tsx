import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { StripeConnectButton } from '@/components/ui/stripe-connect-button';
import { mockStripeClient } from '../../setup/stripe-mocks';
import { renderWithStripe } from '../../test-utils';
import { AuthContext } from '@/auth/AuthContext';

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};


describe('StripeConnectButton', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = jest.fn();
    // Mock supabase auth
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
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: 'https://connect.stripe.com/oauth/authorize?test=1' })
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: 'https://connect.stripe.com/oauth/authorize?test=1' })
      });

      renderWithStripe(
        <StripeConnectButton stripeAccountId={null} />
      );
      
      const button = screen.getByRole('button');
      await act(async () => {
        await fireEvent.click(button);
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('handles connection errors appropriately', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Connection failed' })
      });
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to connect with Stripe' })
      });

      renderWithStripe(
        <StripeConnectButton stripeAccountId={null} />
      );
      
      const button = screen.getByRole('button');
      await act(async () => {
        await fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to connect with stripe/i)).toBeInTheDocument();
      });
    });
  });
});
