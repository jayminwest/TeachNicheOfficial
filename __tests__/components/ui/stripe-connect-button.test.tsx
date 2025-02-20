import { render, screen, fireEvent } from '@testing-library/react';
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
  });
});
