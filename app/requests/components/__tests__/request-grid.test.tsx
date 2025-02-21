import { render, screen, waitFor } from '@testing-library/react'
import { RequestGrid } from '@/app/requests/components/request-grid'
import { getRequests } from '@/lib/supabase/requests'

jest.mock('@/lib/supabase/requests')

describe('RequestGrid', () => {
  const mockRequests = [
    {
      id: '1',
      title: 'Request 1',
      description: 'Description 1',
      category: 'Beginner Fundamentals',
      created_at: new Date().toISOString(),
      status: 'open',
      vote_count: 5,
      user_id: 'user1'
    },
    {
      id: '2',
      title: 'Request 2',
      description: 'Description 2',
      category: 'Advanced Techniques',
      created_at: new Date().toISOString(),
      status: 'open',
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
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders requests from initial data without loading', () => {
    render(<RequestGrid initialRequests={mockRequests} />)
    
    expect(screen.getByText('Request 1')).toBeInTheDocument()
    expect(screen.getByText('Request 2')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('loads and displays requests when no initial data provided', async () => {
    render(<RequestGrid />)

    await waitFor(() => {
      expect(screen.getByText('Request 1')).toBeInTheDocument()
      expect(screen.getByText('Request 2')).toBeInTheDocument()
    })

    expect(getRequests).toHaveBeenCalled()
  })

  it('displays empty state when no requests found', async () => {
    (getRequests as jest.Mock).mockResolvedValue([])
    
    render(<RequestGrid />)

    await waitFor(() => {
      expect(screen.getByText(/no lesson requests found/i)).toBeInTheDocument()
    })
  })

  it('filters requests by category when provided', async () => {
    const category = 'Beginner Fundamentals'
    render(<RequestGrid category={category} />)

    await waitFor(() => {
      expect(getRequests).toHaveBeenCalledWith({ category })
    })
  })
})
