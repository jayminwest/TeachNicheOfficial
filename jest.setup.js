require('@testing-library/jest-dom')

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}))

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: () => Promise.resolve({
    redirectToCheckout: jest.fn(() => Promise.resolve({ error: null })),
  }),
}))

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
