import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StripeConnectButton } from '@/components/ui/stripe-connect-button';
import { mockStripeClient } from '../../setup/stripe-mocks';
import { renderWithStripe } from '../../test-utils';

describe('StripeConnectButton', () => {
  describe('rendering', () => {
    it('renders connect button when not connected', () => {
      renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
      
      expect(screen.getByRole('button', { 
        name: /connect with stripe/i 
      })).toBeInTheDocument();
    });

    it('renders connected status when account exists', () => {
      renderWithStripe(<StripeConnectButton stripeAccountId="acct_test123" />);
      
      expect(screen.getByText(/connected to stripe/i)).toBeInTheDocument();
    });

    it('shows loading state during connection', async () => {
      renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });

  describe('interactions', () => {
    it('initiates oauth flow when clicked', () => {
      const mockWindow = { location: { href: '' } };
      global.window = Object.create(mockWindow);
      
      renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(global.window.location.href).toContain('connect.stripe.com/oauth/authorize');
    });

    it('handles connection errors appropriately', async () => {
      mockStripeClient.accounts.create.mockRejectedValueOnce(new Error('Connection failed'));
      
      renderWithStripe(<StripeConnectButton stripeAccountId={null} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/error connecting to stripe/i)).toBeInTheDocument();
      });
    });
  });
});
