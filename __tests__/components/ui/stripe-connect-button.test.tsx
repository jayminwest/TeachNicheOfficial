import { screen } from '@testing-library/react';
import { StripeConnectButton } from '@/components/ui/stripe-connect-button';
import { renderWithStripe } from '../../test-utils';
import { AuthContext } from '@/auth/AuthContext';

// Mock AuthContext
jest.mock('@/auth/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false
  })
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
