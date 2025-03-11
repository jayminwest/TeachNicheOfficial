import { render, screen } from '@testing-library/react'
import NotFound from '@/app/not-found'

describe('NotFound Component', () => {
  it('renders the 404 page with correct elements', () => {
    render(<NotFound />)
    
    // Check for heading elements
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    
    // Check for description text
    expect(screen.getByText(/The page you are looking for doesn't exist or has been moved./)).toBeInTheDocument()
    
    // Check for navigation links
    const homeLink = screen.getByText('Return Home')
    expect(homeLink).toBeInTheDocument()
    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
    
    const lessonsLink = screen.getByText('Browse Lessons')
    expect(lessonsLink).toBeInTheDocument()
    expect(lessonsLink.closest('a')).toHaveAttribute('href', '/lessons')
  })

  it('has the correct styling classes', () => {
    render(<NotFound />)
    
    // Check container styling
    const container = screen.getByText('404').closest('div')
    expect(container).toHaveClass('container')
    expect(container).toHaveClass('flex')
    expect(container).toHaveClass('min-h-[70vh]')
    
    // Check button styling
    const homeButton = screen.getByText('Return Home')
    expect(homeButton).toHaveClass('bg-primary')
    expect(homeButton).toHaveClass('text-primary-foreground')
    
    const lessonsButton = screen.getByText('Browse Lessons')
    expect(lessonsButton).toHaveClass('border')
    expect(lessonsButton).toHaveClass('border-input')
    expect(lessonsButton).toHaveClass('bg-background')
  })
})
