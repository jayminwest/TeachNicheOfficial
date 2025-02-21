import React from 'react';
import { render } from '@testing-library/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Mock Stripe to avoid actual API calls
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({}))
}));

export function renderWithStripe(ui: React.ReactElement) {
  const mockStripe = loadStripe('mock_key');
  
  return render(
    <Elements stripe={mockStripe}>
      {ui}
    </Elements>
  );
}
