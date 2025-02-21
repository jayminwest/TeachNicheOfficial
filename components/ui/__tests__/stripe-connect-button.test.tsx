import React from 'react';
import { render, screen } from '@testing-library/react';
import { StripeConnectButton } from '../stripe-connect-button';
import { mockUseAuth } from '@/__mocks__/services/auth';
import { createMockUser } from '@/__mocks__/services/auth';

// Mock the useAuth hook
jest.mock('@/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

describe('StripeConnectButton', () => {
  it('renders connect button when user is authenticated and not connected', () => {
    // Arrange
    const mockUser = createMockUser();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    });

    // Act
    render(<StripeConnectButton />);

    // Assert
    expect(screen.getByRole('button')).toHaveTextContent('Connect with Stripe');
  });
});
