import { render } from '@testing-library/react'
import { RequestCard } from '../request-card'

jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: () => ({ user: null })
}))

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  getFirebaseAuth: () => ({})
}))

describe('RequestCard', () => {
  it('renders without crashing', () => {
    const mockRequest = {
      id: '123',
      title: 'Test Request',
      description: 'Test Description',
      category: 'Test Category',
      created_at: '2023-01-01T00:00:00.000Z',
      status: 'open' as 'open' | 'in_progress' | 'completed',
      vote_count: 0,
      user_id: 'user123'
    }

    render(<RequestCard request={mockRequest} onVote={() => {}} />)
  })
})
