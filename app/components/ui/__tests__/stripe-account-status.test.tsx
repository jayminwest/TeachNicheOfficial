import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StripeAccountStatus } from '../stripe-account-status';
import '@testing-library/jest-dom';

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

describe('StripeAccountStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock response
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

  it('renders with complete status', () => {
    render(
      <StripeAccountStatus 
        accountId="acct_123456" 
        status="complete" 
        isComplete={true} 
      />
    );
    
    expect(screen.getByText('Stripe Account Status')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('Your Stripe account is fully set up and ready to receive payments.')).toBeInTheDocument();
    expect(screen.getByText('Account ID: acct_123456')).toBeInTheDocument();
  });

  it('renders with incomplete status', () => {
    render(
      <StripeAccountStatus 
        accountId="acct_123456" 
        status="requirements_needed" 
        isComplete={false}
        details={{
          pendingVerification: false,
          missingRequirements: ['external_account']
        }}
      />
    );
    
    expect(screen.getByText('Stripe Account Status')).toBeInTheDocument();
    expect(screen.getByText('Requirements Needed')).toBeInTheDocument();
    expect(screen.getByText('Your Stripe account setup is incomplete. Please complete the required steps.')).toBeInTheDocument();
    expect(screen.getByText('Missing Requirements:')).toBeInTheDocument();
    expect(screen.getByText('external_account')).toBeInTheDocument();
  });

  it('renders with verification pending status', () => {
    render(
      <StripeAccountStatus 
        accountId="acct_123456" 
        status="verification_pending" 
        isComplete={false}
        details={{
          pendingVerification: true,
          missingRequirements: []
        }}
      />
    );
    
    expect(screen.getByText('Stripe Account Status')).toBeInTheDocument();
    expect(screen.getByText('Verification Pending')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    render(
      <StripeAccountStatus 
        accountId="acct_123456" 
        status="complete" 
        isComplete={true} 
      />
    );
    
    const refreshButton = screen.getByRole('button', { name: /Refresh Status/i });
    expect(refreshButton).toBeInTheDocument();
    
    fireEvent.click(refreshButton);
    
    // Button should show loading state
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    
    // Wait for the fetch to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // Initial load + refresh
      expect(fetch).toHaveBeenCalledWith(
        '/api/stripe/connect/status',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
    
    // Button should return to normal state
    expect(screen.getByText('Refresh Status')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    // Setup error response for the refresh action
    (fetch as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    
    console.error = jest.fn(); // Suppress error logs
    
    render(
      <StripeAccountStatus 
        accountId="acct_123456" 
        status="complete" 
        isComplete={true} 
      />
    );
    
    const refreshButton = screen.getByRole('button', { name: /Refresh Status/i });
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(screen.getByText('Refresh Status')).toBeInTheDocument(); // Button reverts to normal state
    });
  });

  it('listens for stripe-status-updated event', async () => {
    render(
      <StripeAccountStatus 
        accountId="acct_123456" 
        status="requirements_needed" 
        isComplete={false}
      />
    );
    
    // Simulate the custom event
    const eventData = {
      status: 'complete',
      isComplete: true,
      details: {
        pendingVerification: false,
        missingRequirements: []
      }
    };
    
    window.dispatchEvent(new CustomEvent('stripe-status-updated', { detail: eventData }));
    
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Your Stripe account is fully set up and ready to receive payments.')).toBeInTheDocument();
    });
  });
});
