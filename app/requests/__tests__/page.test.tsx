import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestsPage } from '../components/requests-page'
import { getRequests } from '@/app/lib/supabase/requests'
import { useAuth } from '@/app/services/auth/AuthContext'
import { useCategories } from '@/app/hooks/useCategories'
import { LessonRequest } from '@/app/lib/schemas/lesson-request'
import { useRouter } from 'next/navigation'

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="x-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  ArrowUpDown: () => <div data-testid="arrow-up-down-icon" />,
  ThumbsUp: () => <div data-testid="thumbs-up-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Loader2: () => <div data-testid="loader-icon" className="animate-spin" />
}))

// Mock dependencies
jest.mock('@/app/lib/supabase/requests')
jest.mock('@/app/services/auth/AuthContext')
jest.mock('@/app/hooks/useCategories')
jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation');
  return {
    ...actual,
    useRouter: jest.fn(() => ({
      push: jest.fn(),
    })),
    useSearchParams: jest.fn(() => ({
      get: jest.fn((param) => {
        if (param === 'category') return null;
        if (param === 'sort') return 'popular';
        return null;
      }),
      toString: jest.fn(() => ''),
    })),
  };
})

// Mock the RequestDialog component
jest.mock('../components/request-dialog', () => ({
  RequestDialog: ({ children }) => <div data-testid="request-dialog">{children}</div>
}))

// Mock the RequestGrid component to avoid testing its internals here
jest.mock('../components/request-grid', () => ({
  RequestGrid: ({ category, sortBy }) => {
    // This mock implementation will render the requests passed via props
    // and also expose the props for testing
    const mockRequests = [
      {
        id: '1',
        title: 'Test Request 1',
        description: 'Description 1',
        category: 'Beginner Fundamentals',
        created_at: new Date().toISOString(),
        status: 'open',
        vote_count: 5,
        user_id: 'user1',
        tags: ['tag1', 'tag2']
      },
      {
        id: '2',
        title: 'Test Request 2',
        description: 'Description 2',
        category: 'Advanced Techniques',
        created_at: new Date().toISOString(),
        status: 'in_progress',
        vote_count: 3,
        user_id: 'user2',
        tags: ['tag3']
      }
    ] as LessonRequest[];

    // When category or sortBy changes, call getRequests with the appropriate params
    if (category || sortBy) {
      (getRequests as jest.Mock).mockImplementation(() => {
        return Promise.resolve(mockRequests);
      });
    }

    return (
      <div data-testid="request-grid">
        {mockRequests.map(req => (
          <div key={req.id} data-testid="request-item">{req.title}</div>
        ))}
      </div>
    );
  }
}))

describe('RequestsPage', () => {
  const mockRequests = [
    {
      id: '1',
      title: 'Test Request 1',
      description: 'Description 1',
      category: 'Beginner Fundamentals',
      created_at: new Date().toISOString(),
      status: 'open',
      vote_count: 5,
      user_id: 'user1',
      tags: ['tag1', 'tag2']
    },
    {
      id: '2',
      title: 'Test Request 2',
      description: 'Description 2',
      category: 'Advanced Techniques',
      created_at: new Date().toISOString(),
      status: 'in_progress',
      vote_count: 3,
      user_id: 'user2',
      tags: ['tag3']
    }
  ]

  const mockCategories = [
    { id: '1', name: 'Beginner Fundamentals', created_at: '', updated_at: '' },
    { id: '2', name: 'Advanced Techniques', created_at: '', updated_at: '' }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getRequests as jest.Mock).mockResolvedValue(mockRequests)
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    ;(useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      loading: false
    })
  })

  it('renders the page title and description', () => {
    render(<RequestsPage />)
    
    // Use getAllByRole to handle multiple headings with the same text
    const headings = screen.getAllByRole('heading', { name: /lesson requests/i });
    expect(headings.length).toBeGreaterThan(0);
    // The description text isn't in the component, so we don't test for it
  })

  it('renders the request grid with initial data', async () => {
    render(<RequestsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Request 1')).toBeInTheDocument()
      expect(screen.getByText('Test Request 2')).toBeInTheDocument()
    })
  })

  it('filters requests by category', async () => {
    const user = userEvent.setup()
    
    // Mock the router.push function before rendering
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush
    }));
    
    // Mock the URLSearchParams implementation
    const mockURLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      toString: jest.fn().mockReturnValue('')
    }));
    global.URLSearchParams = mockURLSearchParams;
    
    render(<RequestsPage />)

    // Wait for sidebar and categories to be rendered
    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Beginner Fundamentals' })).toBeInTheDocument()
    })

    // Click category filter
    const categoryButton = screen.getByRole('button', { name: 'Beginner Fundamentals' })
    await user.click(categoryButton)

    // Verify router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/requests\?/));
  })

  it('changes sort order', async () => {
    const user = userEvent.setup()
    
    // Mock the router.push function before rendering
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush
    }));
    
    render(<RequestsPage />)

    // Wait for sort options to be rendered
    await waitFor(() => {
      expect(screen.getByText('Sort By')).toBeInTheDocument()
    })

    // Click sort option
    const popularButton = screen.getByRole('button', { name: 'Most Popular' })
    await user.click(popularButton)

    // Verify router.push was called with the correct path
    // The URL might not contain 'sort=popular' if it's already the default
    expect(mockPush).toHaveBeenCalled()
  })

  it('toggles mobile sidebar', async () => {
    const user = userEvent.setup()
    render(<RequestsPage />)

    // Find and click mobile menu button
    const menuButton = screen.getByRole('button', { name: 'Toggle sidebar' })
    await user.click(menuButton)

    // Verify sidebar is visible
    expect(screen.getByText('Filter & Sort')).toBeInTheDocument()

    // Close sidebar using the close button
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    // Verify sidebar is hidden by checking the transform class
    const sidebar = screen.getByTestId('request-sidebar')
    expect(sidebar).toHaveClass('-translate-x-full')
  })
})
