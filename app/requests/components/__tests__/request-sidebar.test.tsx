import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(popularButton).toHaveClass('secondary')
  })

  it('shows selected category', () => {
    render(<RequestSidebar {...defaultProps} selectedCategory="Beginner Fundamentals" />)
    
    const categoryButton = screen.getByRole('button', { name: /beginner fundamentals/i })
    expect(categoryButton).toHaveClass('secondary')
  })
})
