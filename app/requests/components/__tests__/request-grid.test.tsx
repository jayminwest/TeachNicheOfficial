import { render, screen, waitFor, act } from '@testing-library/react'
import { RequestGrid } from '@/app/requests/components/request-grid'
import { getRequests } from '@/app/lib/firebase/requests'

// Mock Firebase services
jest.mock('@/app/services/firebase', () => ({
  auth: {
    useDeviceLanguage: jest.fn(),
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

// Mock Firebase client with getFirebaseAuth function
jest.mock('@/app/lib/firebase/client', () => ({
  getFirebaseAuth: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null }),
    eq: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null })
  })
}))

jest.mock('@/app/lib/firebase/requests')

// Mock Firebase auth
jest.mock('@/app/services/firebase', () => ({
  auth: {
    useDeviceLanguage: jest.fn(),
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

describe('RequestGrid', () => {
  const mockRequests = [
    {
      id: '1',
      title: 'Request 1',
      description: 'Description 1',
      category: 'Beginner Fundamentals',
      created_at: new Date().toISOString(),
      status: 'open' as 'open' | 'in_progress' | 'completed',
      vote_count: 5,
      user_id: 'user1'
    },
    {
      id: '2',
      title: 'Request 2',
      description: 'Description 2',
      category: 'Advanced Techniques',
      created_at: new Date().toISOString(),
      status: 'open' as 'open' | 'in_progress' | 'completed',
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
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders requests from initial data without loading', () => {
    render(<RequestGrid initialRequests={mockRequests} />)
    
    expect(screen.getByText('Request 1')).toBeInTheDocument()
    expect(screen.getByText('Request 2')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('loads and displays requests when no initial data provided', async () => {
    render(<RequestGrid />)
    
    // First verify loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    // Wait for data to load and render
    await waitFor(() => {
      expect(screen.getByText('Request 1')).toBeInTheDocument()
      expect(screen.getByText('Request 2')).toBeInTheDocument()
    })

    // Verify loading spinner is gone
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  })

  it('displays empty state when no requests found', async () => {
    (getRequests as jest.Mock).mockResolvedValue([])
    
    render(<RequestGrid />)

    // First wait for loading state to appear
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    // Then wait for empty state to appear
    await waitFor(() => {
      expect(screen.getByText(/no lesson requests found/i)).toBeInTheDocument()
    })
  })

  it('filters requests by category when provided', async () => {
    const category = 'Beginner Fundamentals'
    render(<RequestGrid category={category} />)

    await waitFor(() => {
      expect(getRequests).toHaveBeenCalledWith({ 
        category,
        sortBy: 'popular' // Include the default sortBy parameter
      })
    })
  })
})
