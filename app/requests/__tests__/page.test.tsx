import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RequestsPage from '../page'
import { getRequests } from '@/app/lib/supabase/requests'
import { useAuth } from '@/app/services/auth/AuthContext'

// Mock dependencies
jest.mock('@/app/lib/supabase/requests')
jest.mock('@/app/services/auth/AuthContext')
jest.mock('@supabase/auth-helpers-nextjs')

describe('RequestsPage', () => {
  const mockRequests = [
    {
      id: '1',
      title: 'Test Request 1',
      description: 'Description 1',
      category: 'Beginner Fundamentals',
      created_at: new Date().toISOString(),
      status: 'open',
      vote_count: 5,
      user_id: 'user1',
      tags: ['tag1', 'tag2']
    },
    {
      id: '2',
      title: 'Test Request 2',
      description: 'Description 2',
      category: 'Advanced Techniques',
      created_at: new Date().toISOString(),
      status: 'in_progress',
      vote_count: 3,
      user_id: 'user2',
      tags: ['tag3']
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getRequests as jest.Mock).mockResolvedValue(mockRequests)
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
  })

  it('renders the page title and description', () => {
    render(<RequestsPage />)
    
    expect(screen.getByRole('heading', { name: /all lesson requests/i })).toBeInTheDocument()
    expect(screen.getByText(/Browse and vote on lesson requests/i)).toBeInTheDocument()
  })

  it('renders the request grid with initial data', async () => {
    render(<RequestsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Request 1')).toBeInTheDocument()
      expect(screen.getByText('Test Request 2')).toBeInTheDocument()
    })
  })

  it('filters requests by category', async () => {
    const user = userEvent.setup()
    render(<RequestsPage />)

    // Wait for sidebar to be rendered
    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument()
    })

    // Click category filter
    const categoryButton = screen.getByRole('button', { name: 'Beginner Basics' })
    await user.click(categoryButton)

    // Verify getRequests was called with correct category
    expect(getRequests).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Beginner Basics' })
    )
  })

  it('changes sort order', async () => {
    const user = userEvent.setup()
    render(<RequestsPage />)

    // Wait for sort options to be rendered
    await waitFor(() => {
      expect(screen.getByText('Sort By')).toBeInTheDocument()
    })

    // Click sort option
    const popularButton = screen.getByRole('button', { name: 'Most Popular' })
    await user.click(popularButton)

    // Verify getRequests was called with correct sort order
    expect(getRequests).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'popular' })
    )
  })

  it('toggles mobile sidebar', async () => {
    const user = userEvent.setup()
    render(<RequestsPage />)

    // Find and click mobile menu button
    const menuButton = screen.getByRole('button', { name: 'Toggle sidebar' })
    await user.click(menuButton)

    // Verify sidebar is visible
    expect(screen.getByText('Filter & Sort')).toBeInTheDocument()

    // Close sidebar using the close button
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    // Verify sidebar is hidden by checking the transform class
    const sidebar = screen.getByTestId('request-sidebar')
    expect(sidebar).toHaveClass('-translate-x-full')
  })

  it('shows auth dialog when non-authenticated user tries to create request', async () => {
    const user = userEvent.setup()
    render(<RequestsPage />)

    // Click new request button
    const newRequestButton = screen.getByRole('button', { name: /new request/i })
    await user.click(newRequestButton)

    // Wait for auth dialog to appear and check for sign in/up text
    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })
  })

  it('allows authenticated users to create requests', async () => {
    // Mock authenticated user
    ;(useAuth as jest.Mock).mockReturnValue({ 
      user: { id: 'test-user', email: 'test@example.com' }
    })

    const user = userEvent.setup()
    render(<RequestsPage />)

    // Click new request button
    const newRequestButton = screen.getByRole('button', { name: /new request/i })
    await user.click(newRequestButton)

    // Wait for request dialog to appear
    await waitFor(() => {
      expect(screen.getByText(/create new lesson request/i)).toBeInTheDocument()
    })
  })
})
