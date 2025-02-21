import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Set up test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase-url.com'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Add TextEncoder/TextDecoder to global
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ 
        data: { 
          session: { user: { id: 'test-user-id' } } 
        } 
      })
    }
  })
}))

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
