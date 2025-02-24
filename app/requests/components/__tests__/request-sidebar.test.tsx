import { render, screen } from '@testing-library/react'
import { RequestSidebar } from '../request-sidebar'
import { useCategories } from '@/app/hooks/useCategories'

// Mock the useCategories hook
jest.mock('@/app/hooks/useCategories')

describe('RequestSidebar', () => {
  const mockCategories = [
    { id: '1', name: 'Beginner Fundamentals', created_at: '', updated_at: '' },
    { id: '2', name: 'Advanced Techniques', created_at: '', updated_at: '' }
  ]

  const defaultProps = {
    selectedCategory: undefined,
    onSelectCategory: jest.fn(),
    sortBy: 'newest' as const,
    onSortChange: jest.fn(),
    isOpen: true,
    onClose: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock the categories hook implementation
    ;(useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      loading: false
    })
  })

  it('renders basic sidebar elements', () => {
    render(<RequestSidebar {...defaultProps} />)
    
    expect(screen.getByText('Sort By')).toBeInTheDocument()
    expect(screen.getByText('Categories')).toBeInTheDocument()
    expect(screen.getByText('All Requests')).toBeInTheDocument()
    expect(screen.getByText('New Request')).toBeInTheDocument()
  })

  it('shows selected sort option', () => {
    render(<RequestSidebar {...defaultProps} sortBy="popular" />)
    
    const popularButton = screen.getByRole('button', { name: /most popular/i })
    expect(popularButton.className).toContain('bg-secondary')
  })

  it('shows selected category', () => {
    render(<RequestSidebar {...defaultProps} selectedCategory="Beginner Fundamentals" />)
    
    const categoryButton = screen.getByRole('button', { name: /beginner fundamentals/i })
    expect(categoryButton.className).toContain('bg-secondary')
  })
})
