import { renderWithAuth } from '../../__tests__/utils/test-utils'
import { axe } from 'jest-axe'
import ProfilePage from '../page'
import { supabase } from "@/app/services/supabase"
import { createMockUser } from '@/__mocks__/services/auth'
import { waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock dependencies
jest.mock('@/app/services/supabase')

describe('ProfilePage', () => {
  const mockUser = createMockUser()
  const mockProfileData = {
    stripe_account_id: 'mock-stripe-account'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock the Supabase query response
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfileData,
            error: null
          })
        })
      })
    })
  })

  describe('rendering', () => {
    it('renders loading state initially', async () => {
      const { getByText } = renderWithAuth(<ProfilePage />, { user: null })
      expect(getByText('Loading...')).toBeInTheDocument()
    })

    it('redirects unauthenticated users', async () => {
      // Mock next/navigation redirect
      const mockRedirect = jest.fn()
      jest.mock('next/navigation', () => ({
        redirect: mockRedirect
      }))

      renderWithAuth(<ProfilePage />, { user: null })
      // Let the effect run
      await waitFor(() => {
        expect(mockRedirect).toHaveBeenCalledWith('/')
      })
    })

    it('renders profile page for authenticated users', async () => {
      const { getByText, getByRole } = renderWithAuth(<ProfilePage />, { user: mockUser })
      
      await waitFor(() => {
        // Test main elements
        const profileTab = getByRole('tab', { name: 'Profile' })
        const contentTab = getByRole('tab', { name: 'Content' })
        const settingsTab = getByRole('tab', { name: 'Settings' })
        
        expect(profileTab).toBeInTheDocument()
        expect(contentTab).toBeInTheDocument()
        expect(settingsTab).toBeInTheDocument()
      })

      // Verify profile data was fetched
      expect(supabase.from).toHaveBeenCalledWith('profiles')
    })

    it('meets accessibility requirements', async () => {
      const { container } = renderWithAuth(<ProfilePage />, { user: mockUser })
      
      await waitFor(() => {
        // Wait for the page to be fully rendered
      })
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('interactions', () => {
    it('allows switching between tabs', async () => {
      const user = userEvent.setup()
      const { getByRole, getByText } = renderWithAuth(<ProfilePage />, { user: mockUser })
      
      await waitFor(() => {
        // Wait for the page to load
      })

      // Click Content tab
      const contentTab = getByRole('tab', { name: 'Content' })
      await user.click(contentTab)
      
      // Should now show Content tab content
      expect(getByText('Content')).toBeVisible()

      // Click Settings tab
      const settingsTab = getByRole('tab', { name: 'Settings' })
      await user.click(settingsTab)
      
      // Should now show Settings tab content
      expect(getByText('Stripe Connect')).toBeVisible()
      expect(getByText('Connect your Stripe account to receive payments for your lessons')).toBeVisible()
    })

    it('displays stripe connect button with account ID', async () => {
      const { getByRole, getByText } = renderWithAuth(<ProfilePage />, { user: mockUser })
      
      await waitFor(() => {
        // Wait for the page to load
      })

      // Click Settings tab to see the stripe connect button
      const settingsTab = getByRole('tab', { name: 'Settings' })
      await userEvent.click(settingsTab)
      
      // Should show stripe section with account info
      expect(getByText('Stripe Connect')).toBeVisible()
    })
  })
})