import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestDialog } from '../request-dialog'
import { useAuth } from '@/app/services/auth/AuthContext'
import { createRequest, updateRequest, deleteRequest } from '@/app/lib/supabase/requests'
import { useCategories } from '@/app/hooks/useCategories'

// Mock dependencies
jest.mock('@/app/services/auth/AuthContext')
jest.mock('@/app/lib/supabase/requests')
jest.mock('@/app/hooks/useCategories')
jest.mock('@/app/components/ui/auth-dialog', () => ({
  AuthDialog: ({ open }: { open: boolean }) => 
    open ? <div>Sign in to Teach Niche</div> : null
}))

const mockChildren = <div>Trigger Content</div>
const mockRequest = {
  id: 'test-id',
  title: 'Test Request',
  description: 'Test Description',
  category: 'Trick Tutorial',
  instagram_handle: '@test',
  tags: [],
  created_at: '2024-01-01',
  user_id: 'test-user',
  status: 'open' as 'open' | 'in_progress' | 'completed',
  vote_count: 0
}

describe('RequestDialog', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    // Mock authenticated user by default
    ;(useAuth as jest.Mock).mockReturnValue({ 
      user: { id: 'test-user' }
    })
    // Mock categories hook
    ;(useCategories as jest.Mock).mockReturnValue({
      categories: [{ id: '1', name: 'Trick Tutorial' }],
      loading: false,
      error: null
    })
    // Mock request functions
    ;(createRequest as jest.Mock).mockResolvedValue({ id: 'test-request' })
    ;(updateRequest as jest.Mock).mockResolvedValue({ id: 'test-request' })
    ;(deleteRequest as jest.Mock).mockResolvedValue(true)
    // Mock window.location.reload
    const mockReload = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })
    // Mock window.confirm
    window.confirm = jest.fn(() => true)
  })

  it('renders create mode correctly', () => {
    render(<RequestDialog>{mockChildren}</RequestDialog>)
    expect(screen.getByTestId('new-request-button')).toBeInTheDocument()
  })

  it('renders edit mode correctly', () => {
    render(
      <RequestDialog mode="edit" request={mockRequest}>
        {mockChildren}
      </RequestDialog>
    )
    expect(screen.getByTestId('new-request-button')).toBeInTheDocument()
  })

  it('shows auth dialog when unauthenticated user clicks button', async () => {
    // Mock unauthenticated state
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    
    const user = userEvent.setup()
    render(<RequestDialog>{mockChildren}</RequestDialog>)
    
    await user.click(screen.getByTestId('new-request-button'))
    
    expect(screen.getByText(/sign in to teach niche/i)).toBeInTheDocument()
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


  it('handles request deletion', async () => {
    const user = userEvent.setup()
    render(
      <RequestDialog mode="edit" request={mockRequest}>
        {mockChildren}
      </RequestDialog>
    )
    
    // Open dialog
    await user.click(screen.getByTestId('new-request-button'))
    
    // Click delete button
    await user.click(screen.getByRole('button', { name: /delete request/i }))
    
    // Verify deletion flow
    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(deleteRequest).toHaveBeenCalledWith('test-id')
      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<RequestDialog>{mockChildren}</RequestDialog>)
    
    // Open dialog
    await user.click(screen.getByTestId('new-request-button'))
    
    // Submit empty form
    await user.click(screen.getByRole('button', { name: /submit request/i }))
    
    // Check validation messages
    expect(await screen.findByText(/title must be at least 3 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/description must be at least 10 characters/i)).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<RequestDialog>{mockChildren}</RequestDialog>)
    
    const button = screen.getByTestId('new-request-button')
    button.focus()
    
    // Test Enter key
    await user.keyboard('{Enter}')
    
    // Check if dialog opened
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveTextContent(/create new lesson request/i)
    
    // Test Escape key closes dialog
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

})
