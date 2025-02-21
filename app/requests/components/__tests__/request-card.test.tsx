import { render, screen } from '@testing-library/react'
import { RequestCard } from '@/app/requests/components/request-card'
import { useAuth } from '@/auth/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { mockSupabaseClient } from '@/__mocks__/services/supabase'
import { mockAuthContext } from '@/__mocks__/services/auth'

jest.mock('@/auth/AuthContext')
jest.mock('@/components/ui/use-toast')
jest.mock('@supabase/auth-helpers-nextjs')

describe('RequestCard', () => {
  const mockRequest = {
    id: '123',
    title: 'Test Request',
    description: 'Test Description',
    category: 'Beginner Fundamentals',
    created_at: '2023-01-01T00:00:00.000Z',
    status: 'open',
    vote_count: 5,
    user_id: 'user123'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue(mockAuthContext)
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  it('renders request details correctly', () => {
    const onVote = jest.fn()
    
    render(<RequestCard request={mockRequest} onVote={onVote} />)
    
    expect(screen.getByText(mockRequest.title)).toBeInTheDocument()
    expect(screen.getByText(mockRequest.description)).toBeInTheDocument()
    expect(screen.getByText(mockRequest.category)).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Initial vote count
    expect(screen.getByText(/Status: open/i)).toBeInTheDocument()
  })
})
