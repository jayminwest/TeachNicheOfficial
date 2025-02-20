import { screen } from '@testing-library/react';
import { StripeConnectButton } from '@/components/ui/stripe-connect-button';
import { renderWithStripe } from '../../test-utils';
import { AuthContext } from '@/auth/AuthContext';

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
});
