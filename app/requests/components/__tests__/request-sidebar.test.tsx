import { render, screen } from '@testing-library/react'
import { RequestSidebar } from '../request-sidebar'

describe('RequestSidebar', () => {
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
    render(<RequestSidebar {...defaultProps} selectedCategory="Beginner Basics" />)
    
    const categoryButton = screen.getByRole('button', { name: /beginner basics/i })
    expect(categoryButton.className).toContain('bg-secondary')
  })
})
