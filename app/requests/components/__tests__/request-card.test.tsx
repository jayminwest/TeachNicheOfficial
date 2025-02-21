import { render, screen } from '@testing-library/react'
import { RequestCard } from '@/app/requests/components/request-card'
import { useAuth } from '@/app/services/auth/AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Mock modules
jest.mock('@/app/services/auth/AuthContext')
jest.mock('@/app/components/ui/use-toast')
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => mockSupabaseClient)
}))

// Define mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  head: jest.fn().mockReturnThis()
}

// Mock auth context
const mockAuthContext = {
  user: { id: 'testuser', email: 'test@example.com' },
  loading: false
}

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
