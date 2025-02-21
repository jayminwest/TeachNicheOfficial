import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestCard } from '@/app/requests/components/request-card'
import { useAuth } from '@/auth/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { mockSupabaseClient } from '@/__mocks__/services/supabase'
import { mockAuthContext } from '@/__mocks__/services/auth'

jest.mock('@/auth/AuthContext')
jest.mock('@/components/ui/use-toast')
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn()
}))

describe('RequestCard', () => {
  const mockRequest = {
    id: '123',
    title: 'Test Request',
    description: 'Test Description',
    category: 'Beginner Fundamentals',
    created_at: new Date().toISOString(),
    status: 'open',
    vote_count: 5,
    user_id: 'user123'
  }

  const mockOnVote = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue(mockAuthContext)
    ;(createClientComponentClient as jest.Mock).mockImplementation(() => mockSupabaseClient)
    
    // Mock initial vote count query
    mockSupabaseClient.from().select = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue({ data: { count: mockRequest.vote_count } })
    })
  })

  it('renders request details correctly', () => {
    render(<RequestCard request={mockRequest} onVote={mockOnVote} />)
    
    expect(screen.getByText(mockRequest.title)).toBeInTheDocument()
    expect(screen.getByText(mockRequest.description)).toBeInTheDocument()
    expect(screen.getByText(mockRequest.category)).toBeInTheDocument()
    expect(screen.getByText(mockRequest.vote_count.toString())).toBeInTheDocument()
  })

  it('handles vote toggle when user is logged in', async () => {
    const user = userEvent.setup()
    
    // Mock initial vote check
    mockSupabaseClient.from().select = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue({ data: { count: mockRequest.vote_count } }),
      match: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ data: null })
      })
    })

    render(<RequestCard request={mockRequest} onVote={mockOnVote} />)
    
    // First click - add vote
    mockSupabaseClient.from().insert = jest.fn().mockResolvedValue({ error: null })
    await user.click(screen.getByRole('button', { name: /thumbs up/i }))

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lesson_request_votes')
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        request_id: mockRequest.id,
        user_id: mockAuthContext.user.id,
        vote_type: 'up'
      })
    })

    expect(toast).toHaveBeenCalledWith({
      title: "Success", 
      description: "Vote added"
    })

    // Mock vote exists for second click
    mockSupabaseClient.from().select = jest.fn().mockReturnValue({
      match: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ 
          data: { id: '1', request_id: mockRequest.id, user_id: mockAuthContext.user.id }
        })
      })
    })

    mockSupabaseClient.from().delete = jest.fn().mockResolvedValue({ error: null })
    await user.click(screen.getByRole('button', { name: /thumbs up/i }))

    await waitFor(() => {
      expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
    })

    expect(toast).toHaveBeenCalledWith({
      title: "Success",
      description: "Vote removed"
    })
    expect(mockOnVote).toHaveBeenCalledTimes(2)
  })

  it('shows error toast when voting without auth', async () => {
    (useAuth as jest.Mock).mockReturnValue({ ...mockAuthContext, user: null })
    const user = userEvent.setup()
    
    render(<RequestCard request={mockRequest} onVote={mockOnVote} />)
    
    await user.click(screen.getByRole('button', { name: /thumbs up/i }))

    expect(toast).toHaveBeenCalledWith({
      title: "Authentication required",
      description: "Please sign in to vote on requests",
      variant: "destructive"
    })
  })

  it('handles database errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock initial vote check
    mockSupabaseClient.from().select = jest.fn().mockReturnValue({
      match: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ data: null })
      })
    })

    render(<RequestCard request={mockRequest} onVote={mockOnVote} />)
    
    // Mock insert error
    mockSupabaseClient.from().insert = jest.fn().mockResolvedValue({ 
      error: { message: 'Database error' }
    })
    
    await user.click(screen.getByRole('button', { name: /thumbs up/i }))

    expect(toast).toHaveBeenCalledWith({
      title: "Error",
      description: "Database error",
      variant: "destructive"
    })
  })
})
