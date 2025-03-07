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
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn()
};

require('whatwg-fetch')

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn()
  }),
  usePathname: () => '',
  __esModule: true
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  }
}))

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: () => Promise.resolve({
    redirectToCheckout: jest.fn(() => Promise.resolve({ error: null })),
  }),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: (props) => <div data-testid="loader-icon" className={props.className} />,
  CheckCircle: (props) => <div data-testid="check-icon" className={props.className} />,
  AlertCircle: (props) => <div data-testid="alert-icon" className={props.className} />,
  ChevronUp: (props) => <div data-testid="chevron-up-icon" className={props.className} />,
  ChevronDown: (props) => <div data-testid="chevron-down-icon" className={props.className} />,
  Check: (props) => <div data-testid="check-icon" className={props.className} />,
  X: (props) => <div data-testid="x-icon" className={props.className} />,
  Plus: (props) => <div data-testid="plus-icon" className={props.className} />,
  Filter: (props) => <div data-testid="filter-icon" className={props.className} />,
  ArrowUpDown: (props) => <div data-testid="arrow-up-down-icon" className={props.className} />,
  // Add icons used in Features component
  BookOpen: (props) => <div data-testid="book-open-icon" className={props.className} />,
  DollarSign: (props) => <div data-testid="dollar-sign-icon" className={props.className} />,
  Users: (props) => <div data-testid="users-icon" className={props.className} />,
  Shield: (props) => <div data-testid="shield-icon" className={props.className} />,
  Leaf: (props) => <div data-testid="leaf-icon" className={props.className} />,
  GraduationCap: (props) => <div data-testid="graduation-cap-icon" className={props.className} />
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
