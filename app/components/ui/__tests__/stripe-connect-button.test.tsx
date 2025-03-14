import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StripeConnectButton } from '../stripe-connect-button';
import { useAuth } from '@/app/services/auth/AuthContext';
import '@testing-library/jest-dom';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  AlertCircle: (props: any) => <div data-testid="alert-icon" {...props} />,
  CheckCircle: (props: any) => <div data-testid="check-icon" {...props} />,
  XCircle: (props: any) => <div data-testid="x-icon" {...props} />,
  RefreshCw: (props: any) => <div data-testid="refresh-icon" {...props} />,
  Clock: (props: any) => <div data-testid="clock-icon" {...props} />,
  AlertTriangle: (props: any) => <div data-testid="alert-triangle-icon" {...props} />,
  ExternalLink: (props: any) => <div data-testid="external-link-icon" {...props} />,
}));

// Mock the auth context
jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the toast component
jest.mock('@/app/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Helper to setup fetch mock
const mockFetchResponse = (data: any, ok = true) => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: async () => data,
    text: async () => JSON.stringify(data),
  });
};

describe('StripeConnectButton', () => {
  // Save original window.location
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.location
    delete window.location;
    window.location = { ...originalLocation, href: '' } as unknown as Location;
    
    // Setup default auth mock
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user123' },
      loading: false,
    });
    
    // Setup default fetch response
    mockFetchResponse({
      connected: true,
      stripeAccountId: 'acct_123456',
      isComplete: true,
      status: 'complete',
      details: {
        pendingVerification: false,
        missingRequirements: [],
        has_details_submitted: true,
        has_charges_enabled: true,
        has_payouts_enabled: true
      }
    });
  });

  afterEach(() => {
    // Restore window.location
    window.location = originalLocation;
  });

  it('renders with no user', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });
    
    render(<StripeConnectButton />);
    
    expect(screen.getByText('Please sign in to connect Stripe')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders connect button when no account exists', () => {
    render(<StripeConnectButton />);
    
    expect(screen.getByText('Connect with Stripe')).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('renders connected state when account is complete', () => {
    render(
      <StripeConnectButton 
        stripeAccountId="acct_123456"
        stripeStatus={{
          isComplete: true,
          status: 'complete',
          details: {
            pendingVerification: false,
            missingRequirements: [],
            has_details_submitted: true,
            has_charges_enabled: true,
            has_payouts_enabled: true
          }
        }}
      />
    );
    
    expect(screen.getByText('Connected to Stripe')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Your Stripe account is fully set up and ready to receive payments.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connected to Stripe/i })).toBeDisabled();
  });

  it('handles connect button click', async () => {
    render(<StripeConnectButton />);
    
    const connectButton = screen.getByRole('button', { name: /Connect with Stripe/i });
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(window.location.href).toBe('/api/stripe/direct-redirect');
    });
  });

  it('handles refresh button click', async () => {
    render(
      <StripeConnectButton 
        stripeAccountId="acct_123456"
        stripeStatus={{
          isComplete: true,
          status: 'complete',
          details: {
            pendingVerification: false,
            missingRequirements: [],
          }
        }}
      />
    );
    
    const refreshButton = screen.getByRole('button', { name: /Refresh Status from Stripe/i });
    fireEvent.click(refreshButton);
    
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/stripe/connect/status',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }),
        })
      );
    });
  });

  it('handles show/hide debug info', () => {
    render(
      <StripeConnectButton 
        stripeAccountId="acct_123456"
        stripeStatus={{
          isComplete: true,
          status: 'complete',
          details: {
            pendingVerification: false,
            missingRequirements: [],
          }
        }}
      />
    );
    
    // Debug info should be hidden initially
    expect(screen.queryByText('Debug Information:')).not.toBeInTheDocument();
    
    // Click to show debug info
    const showDebugButton = screen.getByRole('button', { name: /Show Debug Info/i });
    fireEvent.click(showDebugButton);
    
    // Debug info should now be visible
    expect(screen.getByText('Debug Information:')).toBeInTheDocument();
    
    // Click to hide debug info
    const hideDebugButton = screen.getByRole('button', { name: /Hide Debug Info/i });
    fireEvent.click(hideDebugButton);
    
    // Debug info should be hidden again
    expect(screen.queryByText('Debug Information:')).not.toBeInTheDocument();
  });

  it('handles external dashboard link click', () => {
    // Mock window.open
    window.open = jest.fn();
    
    render(
      <StripeConnectButton 
        stripeAccountId="acct_123456"
        stripeStatus={{
          isComplete: true,
          status: 'complete',
          details: {
            pendingVerification: false,
            missingRequirements: [],
          }
        }}
      />
    );
    
    const dashboardButton = screen.getByRole('button', { name: /Dashboard/i });
    fireEvent.click(dashboardButton);
    
    expect(window.open).toHaveBeenCalledWith('https://dashboard.stripe.com/', '_blank');
  });

  it('handles fetch error during refresh', async () => {
    // Setup error response
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <StripeConnectButton 
        stripeAccountId="acct_123456"
        stripeStatus={{
          isComplete: true,
          status: 'complete',
          details: {
            pendingVerification: false,
            missingRequirements: [],
          }
        }}
      />
    );
    
    const refreshButton = screen.getByRole('button', { name: /Refresh Status from Stripe/i });
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh Status from Stripe')).toBeInTheDocument();
    });
  });
});
