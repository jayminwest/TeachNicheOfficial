import { render, screen } from '@testing-library/react'
import { Features } from '../features'

describe('Features Component', () => {
  it('renders the component with correct heading', () => {
    render(<Features />)
    
    // Check the main heading
    expect(screen.getByText('Why Choose Teach Niche?')).toBeInTheDocument()
  })

  it('renders all feature items with correct content', () => {
    render(<Features />)
    
    // Check all feature titles
    expect(screen.getByText('Expert Tutorials')).toBeInTheDocument()
    expect(screen.getByText('Monetize Your Skills')).toBeInTheDocument()
    expect(screen.getByText('Community Support')).toBeInTheDocument()
    expect(screen.getByText('Integrity and Fairness')).toBeInTheDocument()
    expect(screen.getByText('Sustainable Growth')).toBeInTheDocument()
    expect(screen.getByText('Growth and Learning')).toBeInTheDocument()
    
    // Check all feature descriptions
    expect(screen.getByText('Access comprehensive tutorials from top kendama players and learn at your own pace')).toBeInTheDocument()
    expect(screen.getByText('Create and sell your own kendama lessons while setting your own prices')).toBeInTheDocument()
    expect(screen.getByText('Join a thriving community of kendama enthusiasts - collaborate and grow together')).toBeInTheDocument()
    expect(screen.getByText('Community-first platform ensuring creators are rewarded fairly')).toBeInTheDocument()
    expect(screen.getByText('Building a long-term ecosystem for kendama education and innovation')).toBeInTheDocument()
    expect(screen.getByText('Resources for skill development and tools to support your favorite players')).toBeInTheDocument()
  })

  it('renders all feature icons', () => {
    render(<Features />)
    
    // Check that all icons are rendered
    expect(screen.getByTestId('book-open-icon')).toBeInTheDocument()
    expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument()
    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
    expect(screen.getByTestId('leaf-icon')).toBeInTheDocument()
    expect(screen.getByTestId('graduation-cap-icon')).toBeInTheDocument()
  })

  it('applies correct styling to feature items', () => {
    render(<Features />)
    
    // Check that we have the correct number of feature items
    const featureItems = screen.getAllByRole('heading', { level: 3 })
    expect(featureItems).toHaveLength(6)
    
    // Check that icons have the primary text color class
    const icons = [
      screen.getByTestId('book-open-icon'),
      screen.getByTestId('dollar-sign-icon'),
      screen.getByTestId('users-icon'),
      screen.getByTestId('shield-icon'),
      screen.getByTestId('leaf-icon'),
      screen.getByTestId('graduation-cap-icon')
    ]
    
    icons.forEach(icon => {
      expect(icon).toHaveClass('text-primary')
    })
  })

  it('renders with the correct container and background styling', () => {
    render(<Features />)
    
    // Check the main container has the correct background class
    const container = screen.getByText('Why Choose Teach Niche?').closest('div')?.parentElement
    expect(container).toHaveClass('py-24')
    expect(container).toHaveClass('bg-muted/50')
  })

  it('renders the correct number of feature items', () => {
    render(<Features />)
    
    // Check we have exactly 6 feature items
    const featureItems = screen.getAllByText(/Expert Tutorials|Monetize Your Skills|Community Support|Integrity and Fairness|Sustainable Growth|Growth and Learning/)
    expect(featureItems).toHaveLength(6)
    
    // Check each feature item has a description
    featureItems.forEach(item => {
      const parent = item.closest('div')
      expect(parent?.querySelector('p')).toBeInTheDocument()
    })
  })

  it('renders with responsive grid layout classes', () => {
    render(<Features />)
    
    // Check the grid container has the correct responsive classes
    const gridContainer = screen.getAllByRole('heading', { level: 3 })[0].closest('div')?.parentElement
    expect(gridContainer).toHaveClass('grid')
    expect(gridContainer).toHaveClass('grid-cols-1')
    expect(gridContainer).toHaveClass('md:grid-cols-2')
    expect(gridContainer).toHaveClass('lg:grid-cols-3')
  })
})
