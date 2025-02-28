import { render } from '@testing-library/react'
import { RequestCard } from '../request-card'

// Mock getFirebaseAuth
jest.mock('@/app/lib/firebase/client', () => ({
  getFirebaseAuth: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null })
  }),
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null })
  }
}))

jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: () => ({ user: null })
}))

jest.mock('@/app/services/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn().mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    }),
  },
  firestore: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      data: () => ({}),
      exists: true,
    }),
  },
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
