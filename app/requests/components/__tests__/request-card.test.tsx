import { render, screen } from '@testing-library/react'
import { RequestCard } from '@/app/requests/components/request-card'
import { useAuth } from '@/app/services/auth/AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Define mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
}

// Define mock auth context
const mockAuthContext = {
  user: { id: 'testuser', email: 'test@example.com' },
  loading: false
}

const mockUseAuth = jest.fn().mockReturnValue(mockAuthContext)
jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))
jest.mock('@/app/components/ui/use-toast')
// Mock createClientComponentClient as a Jest mock function
const mockCreateClientComponentClient = jest.fn(() => mockSupabaseClient)
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: mockCreateClientComponentClient
}))

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
    mockUseAuth.mockReturnValue(mockAuthContext)
    mockCreateClientComponentClient.mockReturnValue(mockSupabaseClient)
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
