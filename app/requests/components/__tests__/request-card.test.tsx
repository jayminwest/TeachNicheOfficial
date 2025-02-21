import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestCard } from '@/app/requests/components/request-card'
import { useAuth } from '@/auth/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { voteOnRequest } from '@/lib/supabase/requests'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

jest.mock('@/auth/AuthContext')
jest.mock('@/components/ui/use-toast')
jest.mock('@/lib/supabase/requests')
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
  const mockUser = { id: 'test-user-id' }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false })
  })

  it('renders request details correctly', () => {
    render(<RequestCard request={mockRequest} onVote={mockOnVote} />)
    
    expect(screen.getByText(mockRequest.title)).toBeInTheDocument()
    expect(screen.getByText(mockRequest.description)).toBeInTheDocument()
    expect(screen.getByText(mockRequest.category)).toBeInTheDocument()
    expect(screen.getByText(mockRequest.vote_count.toString())).toBeInTheDocument()
  })

  it('handles vote toggle when user is logged in', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({ data: null })
        .mockResolvedValueOnce({ data: { id: '1' } }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockResolvedValue({ error: null })
    };
    (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase);
    
    const user = userEvent.setup()
    render(<RequestCard request={mockRequest} onVote={mockOnVote} />)
    
    // First click - add vote
    await user.click(screen.getByRole('button', { name: /thumbs up/i }))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Success",
        description: "Vote added",
      })
    })

    // Second click - remove vote
    await user.click(screen.getByRole('button', { name: /thumbs up/i }))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Success",
        description: "Vote removed",
      })
      expect(mockOnVote).toHaveBeenCalledTimes(2)
    })
  })

  it('shows error toast when voting without auth', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false })
    const user = userEvent.setup()
    
    render(<RequestCard request={mockRequest} onVote={mockOnVote} />)
    
    await user.click(screen.getByRole('button', { name: /thumbs up/i }))

    expect(toast).toHaveBeenCalledWith({
      title: "Authentication required",
      description: "Please sign in to vote on requests",
      variant: "destructive"
    })
  })

  it('handles vote errors gracefully', async () => {
    const user = userEvent.setup()
    const mockError = new Error('Vote failed')
    ;(voteOnRequest as jest.Mock).mockRejectedValue(mockError)

    render(<RequestCard request={mockRequest} onVote={mockOnVote} />)
    
    await user.click(screen.getByRole('button', { name: /thumbs up/i }))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Error",
        description: expect.any(String),
        variant: "destructive"
      })
    })
  })
})
