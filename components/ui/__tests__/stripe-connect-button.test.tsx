import { render, screen, fireEvent } from '@testing-library/react';
import { StripeConnectButton } from '../stripe-connect-button';
import { mockUseAuth } from '@/__mocks__/services/auth';
import { createMockUser } from '@/__mocks__/services/auth';
import { mockSupabaseClient } from '@/__mocks__/services/supabase';
import { createMockSession } from '@/__mocks__/services/supabase';

// Mock the useAuth hook
jest.mock('@/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

describe('StripeConnectButton', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders sign in message when no user', () => {
    mockUseAuth.mockReturnValue({ user: null });
    
    render(<StripeConnectButton />);
    
    expect(screen.getByText('Please sign in to connect Stripe')).toBeInTheDocument();
  });

  it('renders connected message when stripe account exists', () => {
    mockUseAuth.mockReturnValue({ user: createMockUser() });
    
    render(<StripeConnectButton stripeAccountId="acct_123" />);
    
    expect(screen.getByText('Connected to Stripe')).toBeInTheDocument();
  });

  it('renders connect button when authenticated but not connected', () => {
    mockUseAuth.mockReturnValue({ user: createMockUser() });
    mockSupabaseClient.auth.getSession.mockResolvedValue({ 
      data: { session: createMockSession() }, 
      error: null 
    });
    
    render(<StripeConnectButton />);
    
    expect(screen.getByText('Connect with Stripe')).toBeInTheDocument();
  });
});
