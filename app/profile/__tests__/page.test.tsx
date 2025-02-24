import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import ProfilePage from '../page'
import { renderWithAuth } from '@/app/__tests__/test-utils'

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Define mocks before using them
const mockPush = jest.fn()
const mockRedirect = jest.fn()

// Mock the router
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: mockPush,
  }),
  redirect: mockRedirect,
}))

// Mock Supabase client
jest.mock('@/app/services/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { stripe_account_id: 'acct_test123' },
      error: null,
    }),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
      }),
    },
  },
}))

// Add jest-axe matcher
expect.extend({
  toHaveNoViolations: (received) => {
    if (received.violations.length === 0) {
      return {
        pass: true,
        message: () => 'Expected accessibility violations but found none',
      }
    }
    return {
      pass: false,
      message: () => `Expected no accessibility violations but found ${received.violations.length}`,
    }
  }
})

describe('ProfilePage', () => {
  describe('rendering', () => {
    it('renders loading state initially', async () => {
      // Override the default mock to ensure loading state is true
      const { getByText } = renderWithAuth(<ProfilePage />, { 
        user: null,
        loading: true,
        isAuthenticated: false
      })
      expect(getByText('Loading...')).toBeInTheDocument()
    })

    it('redirects unauthenticated users', async () => {
      // Force a re-render with unauthenticated state
      const { rerender } = renderWithAuth(<ProfilePage />, { 
        user: null,
        loading: true, // Start with loading
        isAuthenticated: false
      })
      
      // Then update to not loading to trigger the effect
      rerender(<ProfilePage />, {
        user: null,
        loading: false, // Now not loading
        isAuthenticated: false
      })
      
      // Let the effect run
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('renders profile page for authenticated users', async () => {
      const { getByText } = renderWithAuth(<ProfilePage />)
      expect(getByText('Profile')).toBeInTheDocument()
      expect(getByText('Content')).toBeInTheDocument()
      expect(getByText('Settings')).toBeInTheDocument()
    })

    it('meets accessibility requirements', async () => {
      const { container } = renderWithAuth(<ProfilePage />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('interactions', () => {
    it('allows switching between tabs', async () => {
      const user = userEvent.setup()
      const { getByRole, getByText } = renderWithAuth(<ProfilePage />)

      // Click on Content tab
      await user.click(getByRole('tab', { name: 'Content' }))
      expect(getByText('Create New Lesson')).toBeInTheDocument()

      // Click on Settings tab
      await user.click(getByRole('tab', { name: 'Settings' }))
      expect(getByText('Stripe Connect')).toBeInTheDocument()
    })

    it('displays stripe connect button with account ID', async () => {
      const { getByRole, getByText } = renderWithAuth(<ProfilePage />)
      
      // Navigate to settings tab
      await userEvent.click(getByRole('tab', { name: 'Settings' }))
      
      // Check that the Stripe Connect section is visible
      expect(getByText('Stripe Connect')).toBeInTheDocument()
      expect(getByText('Connect your Stripe account to receive payments for your lessons')).toBeInTheDocument()
    })
  })
})
