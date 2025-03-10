import { render } from '@testing-library/react'
import { RequestCard } from '../request-card'

jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: () => ({ user: null })
}))

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null }),
          head: () => ({ count: 0, error: null })
        })
      })
    })
  })
}))

jest.mock('@/app/lib/supabase/requests', () => ({
  voteOnRequest: jest.fn()
}))

// Mock the SignInToVote component
jest.mock('../sign-in-to-vote', () => ({
  SignInToVote: ({ voteCount }) => (
    <div data-testid="sign-in-to-vote">
      Votes: {voteCount}
    </div>
  )
}))

describe('RequestCard', () => {
  const mockRequest = {
    id: '123',
    title: 'Test Request',
    description: 'Test Description',
    category: 'Test Category',
    created_at: '2023-01-01T00:00:00.000Z',
    status: 'open' as 'open' | 'in_progress' | 'completed',
    vote_count: 0,
    user_id: 'user123',
    tags: ['tag1', 'tag2']
  }

  it('renders without crashing', () => {
    const { getByText, getByTestId } = render(
      <RequestCard request={mockRequest} onVote={() => {}} />
    )
    
    // Verify basic content is rendered
    expect(getByText('Test Request')).toBeInTheDocument()
    expect(getByText('Test Description')).toBeInTheDocument()
    expect(getByText('Test Category')).toBeInTheDocument()
    expect(getByTestId('sign-in-to-vote')).toBeInTheDocument()
  })

  it('renders with instagram handle when provided', () => {
    const requestWithInstagram = {
      ...mockRequest,
      instagram_handle: '@testuser'
    }

    const { getByText } = render(
      <RequestCard request={requestWithInstagram} onVote={() => {}} />
    )
    
    expect(getByText('@testuser')).toBeInTheDocument()
  })
})
