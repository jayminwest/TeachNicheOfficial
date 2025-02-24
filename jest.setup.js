import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { jest } from '@jest/globals'

// Enable new JSX transform
jest.unstable_mockModule('react/jsx-runtime', () => ({
  jsx: jest.fn(),
  jsxs: jest.fn(),
}))

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
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      execute: jest.fn().mockResolvedValue({ data: [], error: null })
    })
  })
}))

// Mock next/navigation
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn()
};

// Mock fetch API instead of using whatwg-fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: new Map()
  })
);
global.Headers = jest.fn();
global.Request = jest.fn();
global.Response = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
  __esModule: true
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
