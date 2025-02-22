import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestDialog } from '../request-dialog'
import { useAuth } from '@/app/services/auth/AuthContext'
import { createRequest } from '@/app/lib/supabase/requests'

// Mock dependencies
jest.mock('@/app/services/auth/AuthContext')
jest.mock('@/app/lib/supabase/requests')

const mockChildren = <div>Trigger Content</div>

describe('RequestDialog', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    // Mock authenticated user by default
    ;(useAuth as jest.Mock).mockReturnValue({ 
      user: { id: 'test-user' }
    })
    // Mock createRequest
    ;(createRequest as jest.Mock).mockResolvedValue({ id: 'test-request' })
    // Mock window.location.reload
    const mockReload = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })
  })

  it('renders the trigger button', () => {
    render(<RequestDialog>{mockChildren}</RequestDialog>)
    expect(screen.getByTestId('new-request-button')).toBeInTheDocument()
  })

  it('shows auth dialog when unauthenticated user clicks button', async () => {
    // Mock unauthenticated state
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    
    const user = userEvent.setup()
    render(<RequestDialog>{mockChildren}</RequestDialog>)
    
    await user.click(screen.getByTestId('new-request-button'))
    
    expect(screen.getByText(/join teach niche/i)).toBeInTheDocument()
  })

  it('shows request form when authenticated user clicks button', async () => {
    const user = userEvent.setup()
    render(<RequestDialog>{mockChildren}</RequestDialog>)
    
    await user.click(screen.getByTestId('new-request-button'))
    
    expect(screen.getByText(/create new lesson request/i)).toBeInTheDocument()
  })

  it('handles form submission successfully', async () => {
    const user = userEvent.setup()
    render(<RequestDialog>{mockChildren}</RequestDialog>)
    
    // Open dialog
    await user.click(screen.getByTestId('new-request-button')) 
    
    // Fill form
    await user.type(screen.getByPlaceholderText(/enter lesson title/i), 'Test Title')
    await user.type(screen.getByPlaceholderText(/describe what you'd like to learn/i), 'Test Description')
    await user.type(screen.getByPlaceholderText(/@username/i), '@testuser')
    
    // Submit form with default category
    await user.click(screen.getByRole('button', { name: /submit request/i }))
    
    // Verify request creation and page reload
    await waitFor(() => {
      expect(createRequest).toHaveBeenCalledWith({
        title: 'Test Title',
        description: 'Test Description',
        category: 'Trick Tutorial',
        instagram_handle: '@testuser',
        tags: []
      })
      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<RequestDialog>{mockChildren}</RequestDialog>)
    
    const button = screen.getByTestId('new-request-button')
    button.focus()
    
    // Test Enter key
    await user.keyboard('{Enter}')
    
    // Use findByText with a longer timeout since dialog animation takes time
    const dialogTitle = await screen.findByText(/create new lesson request/i, {}, { timeout: 2000 })
    expect(dialogTitle).toBeInTheDocument()
  })
})
