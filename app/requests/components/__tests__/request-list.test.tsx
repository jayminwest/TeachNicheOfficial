import { render, screen } from '@testing-library/react'
import { RequestList } from '../request-list'
import { useAuth } from '@/app/services/auth/AuthContext'

// Mock dependencies
jest.mock('@/app/services/auth/AuthContext')

describe('RequestList', () => {
  const mockRequests = [
    {
      id: '1',
      title: 'Test Request 1',
      description: 'Description 1',
      category: 'Beginner Fundamentals',
      created_at: new Date().toISOString(),
      status: 'open',
      vote_count: 5,
      user_id: 'user1'
    },
    {
      id: '2',
      title: 'Test Request 2',
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
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
  })

  it('renders a list of requests', () => {
    render(<RequestList requests={mockRequests} onVote={jest.fn()} />)
    
    expect(screen.getByText('Test Request 1')).toBeInTheDocument()
    expect(screen.getByText('Test Request 2')).toBeInTheDocument()
  })

  it('displays empty state when no requests provided', () => {
    render(<RequestList requests={[]} onVote={jest.fn()} />)
    
    expect(screen.getByText(/no requests found/i)).toBeInTheDocument()
  })
})
