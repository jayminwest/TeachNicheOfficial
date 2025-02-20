import { screen, fireEvent, waitFor } from '@testing-library/react';
import { StripeConnectButton } from '@/components/ui/stripe-connect-button';
import { mockStripeClient } from '../../setup/stripe-mocks';
import { renderWithStripe } from '../../test-utils';

describe('StripeConnectButton', () => {
  describe('rendering', () => {
    it('renders connect button when not connected', () => {
      const { user } = renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent(/connect with stripe/i);
    });

    it('renders connected status when account exists', () => {
      renderWithStripe(<StripeConnectButton stripeAccountId="acct_test123" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent(/connected to stripe/i);
    });

    it('shows loading state during connection', async () => {
      renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
      
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

      const { user } = renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
      
      const button = screen.getByRole('button');
      await fireEvent.click(button);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('handles connection errors appropriately', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Connection failed' })
      });
      
      renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
      
      const button = screen.getByRole('button');
      await fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/failed to connect with stripe/i)).toBeInTheDocument();
      });
    });
  });
});
