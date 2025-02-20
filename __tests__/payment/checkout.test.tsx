import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockStripeClient, mockCheckoutSession } from '../setup/stripe-mocks';
import { renderWithStripe } from '../test-utils';
import { LessonCheckout } from '@/app/components/ui/lesson-checkout';

// Mock the fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(mockStripeClient)),
}));

describe('LessonCheckout', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockStripeClient.redirectToCheckout.mockClear();
  });

  describe('critical path', () => {
    it('creates checkout session successfully', async () => {
      // Setup
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'test_session_123' }),
      });

      // Render
      renderWithStripe(<LessonCheckout lessonId="test_lesson" price={1000} />);

      // Act
      const button = screen.getByRole('button', { name: /purchase lesson/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId: 'test_lesson',
            price: 1000,
          }),
        });
      });

      expect(mockStripeClient.redirectToCheckout).toHaveBeenCalledWith({
        sessionId: 'test_session_123',
      });
    });

    it('redirects to Stripe Checkout', async () => {
      // Setup
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'test_session_123' }),
      });

      // Render
      renderWithStripe(<LessonCheckout lessonId="test_lesson" price={1000} />);

      // Act
      const button = screen.getByRole('button', { name: /purchase lesson/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(mockStripeClient.redirectToCheckout).toHaveBeenCalledTimes(1);
        expect(mockStripeClient.redirectToCheckout).toHaveBeenCalledWith({
          sessionId: 'test_session_123',
        });
      });
    });

    it('handles successful payment completion', async () => {
      // Setup
      const searchParams = new URLSearchParams('?success=true');

      // Render
      renderWithStripe(
        <LessonCheckout 
          lessonId="test_lesson" 
          price={1000}
          searchParams={searchParams}
        />
      );

      // Assert
      const successMessage = screen.getByText(/payment successful/i);
      expect(successMessage).toBeInTheDocument();
    });

    it('handles cancelled payment appropriately', async () => {
      // Setup
      const searchParams = new URLSearchParams('?canceled=true');

      // Render
      renderWithStripe(
        <LessonCheckout 
          lessonId="test_lesson" 
          price={1000}
          searchParams={searchParams}
        />
      );

      // Assert
      const purchaseButton = screen.getByRole('button', { name: /purchase lesson/i });
      expect(purchaseButton).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('handles invalid price errors', async () => {
      // Setup
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Invalid price: must be a positive number' 
        })
      });

      // Render
      renderWithStripe(<LessonCheckout lessonId="test_lesson" price={-50} />);

      // Act
      const button = screen.getByRole('button', { name: /purchase lesson/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid price/i)).toBeInTheDocument();
      });
    });

    it('handles network failures', async () => {
      // Setup
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Render
      renderWithStripe(<LessonCheckout lessonId="test_lesson" price={1000} />);

      // Act
      const button = screen.getByRole('button', { name: /purchase lesson/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('handles session creation failures', async () => {
      // Setup
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'test_session_123' }),
      });
      mockStripeClient.redirectToCheckout.mockRejectedValueOnce(
        new Error('Failed to create checkout session')
      );

      // Render
      renderWithStripe(<LessonCheckout lessonId="test_lesson" price={1000} />);

      // Act
      const button = screen.getByRole('button', { name: /purchase lesson/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to create checkout session/i)).toBeInTheDocument();
      });
    });
  });
});
