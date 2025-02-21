import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestDialog } from '../request-dialog'
import { useAuth } from '@/app/services/auth/AuthContext'
import { createRequest } from '@/app/lib/supabase/requests'

// Mock dependencies
jest.mock('@/app/services/auth/AuthContext')
jest.mock('@/app/lib/supabase/requests')

describe('RequestDialog', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    // Mock authenticated user by default
    ;(useAuth as jest.Mock).mockReturnValue({ 
      user: { id: 'test-user' }
    })
  })

  it('renders the trigger button', () => {
    render(<RequestDialog />)
    expect(screen.getByRole('button', { name: /new request/i })).toBeInTheDocument()
  })

  it('shows auth dialog when unauthenticated user clicks button', async () => {
    // Mock unauthenticated state
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    
    const user = userEvent.setup()
    render(<RequestDialog />)
    
    await user.click(screen.getByRole('button', { name: /new request/i }))
    
    expect(screen.getByText(/join teach niche/i)).toBeInTheDocument()
  })

  it('shows request form when authenticated user clicks button', async () => {
    const user = userEvent.setup()
    render(<RequestDialog />)
    
    await user.click(screen.getByRole('button', { name: /new request/i }))
    
    expect(screen.getByText(/create new lesson request/i)).toBeInTheDocument()
  })
})
