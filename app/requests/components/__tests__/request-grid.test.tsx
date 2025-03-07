import { render, screen, waitFor } from '@testing-library/react'
import { RequestGrid } from '@/app/requests/components/request-grid'
import { getRequests } from '@/app/lib/supabase/requests'

// Mock the necessary dependencies
jest.mock('@/app/lib/supabase/requests')
jest.mock('@supabase/auth-helpers-nextjs')

// Mock the request-card component
jest.mock('@/app/requests/components/request-card', () => ({
  RequestCard: ({ request }: { request: { id: string; title: string; description: string } }) => (
    <div data-testid={`request-card-${request.id}`}>
      <h3>{request.title}</h3>
      <p>{request.description}</p>
    </div>
  )
}))

describe('RequestGrid', () => {
  const mockRequests = [
    {
      id: '1',
      title: 'Request 1',
      description: 'Description 1',
      category: 'Beginner Fundamentals',
      created_at: new Date().toISOString(),
      status: 'open' as 'open' | 'in_progress' | 'completed',
      vote_count: 5,
      user_id: 'user1'
    },
    {
      id: '2',
      title: 'Request 2',
      description: 'Description 2',
      category: 'Advanced Techniques',
      created_at: new Date().toISOString(),
      status: 'open' as 'open' | 'in_progress' | 'completed',
      vote_count: 3,
      user_id: 'user2'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getRequests as jest.Mock).mockResolvedValue(mockRequests)
  })

  it('renders loading state initially when no initial requests provided', () => {
    render(<RequestGrid />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders requests from initial data without loading', () => {
    render(<RequestGrid initialRequests={mockRequests} />)
    
    expect(screen.getByText('Request 1')).toBeInTheDocument()
    expect(screen.getByText('Request 2')).toBeInTheDocument()
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  })

  it('loads and displays requests when no initial data provided', async () => {
    render(<RequestGrid />)
    
    // First verify loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    // Wait for data to load and render
    await waitFor(() => {
      expect(screen.getByText('Request 1')).toBeInTheDocument()
      expect(screen.getByText('Request 2')).toBeInTheDocument()
    })

    // Verify loading spinner is gone
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  })

  it('displays empty state when no requests found', async () => {
    (getRequests as jest.Mock).mockResolvedValue([])
    
    render(<RequestGrid />)

    // First wait for loading state to appear
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    // Then wait for empty state to appear
    await waitFor(() => {
      expect(screen.getByText(/no lesson requests found/i)).toBeInTheDocument()
    })
  })

  it('filters requests by category when provided', async () => {
    const category = 'Beginner Fundamentals'
    render(<RequestGrid category={category} />)

    await waitFor(() => {
      expect(getRequests).toHaveBeenCalledWith({ 
        category,
        sortBy: 'popular' // Include the default sortBy parameter
      })
    })
  })
})
