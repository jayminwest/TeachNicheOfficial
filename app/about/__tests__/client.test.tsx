import { render, screen, fireEvent } from '@testing-library/react'
import { AboutAccordion } from '../client'

describe('AboutAccordion', () => {
  it('renders the accordion component', () => {
    render(<AboutAccordion />)
    
    // Check if the Values trigger is rendered
    const valuesTrigger = screen.getByText('Values')
    expect(valuesTrigger).toBeInTheDocument()
  })

  it('expands and collapses when clicked', () => {
    render(<AboutAccordion />)
    
    // Initially content should not be in the document or hidden
    const initialContent = screen.queryByText('Community Collaboration')
    expect(initialContent).not.toBeInTheDocument()
    
    // Click to expand
    const valuesTrigger = screen.getByText('Values')
    fireEvent.click(valuesTrigger)
    
    // Now content should be visible
    expect(screen.getByText('Community Collaboration')).toBeVisible()
    expect(screen.getByText('Growth and Learning')).toBeVisible()
    expect(screen.getByText('Integrity and Fairness')).toBeVisible()
    expect(screen.getByText('Sustainability')).toBeVisible()
    
    // Click again to collapse
    fireEvent.click(valuesTrigger)
    
    // Content should be hidden after collapsing
    // We need to use queryByText since the element might be in the DOM but hidden
    const collapsedContent = screen.queryByText('Community Collaboration')
    expect(collapsedContent).not.toBeVisible()
  })

  it('renders all value items with correct content', () => {
    render(<AboutAccordion />)
    
    // Expand the accordion
    const valuesTrigger = screen.getByText('Values')
    fireEvent.click(valuesTrigger)
    
    // Check for all headings and their descriptions
    expect(screen.getByText('Community Collaboration')).toBeInTheDocument()
    expect(screen.getByText('Teach Niche fosters a space where kendama players of all levels can connect, share, and grow together.')).toBeInTheDocument()
    
    expect(screen.getByText('Growth and Learning')).toBeInTheDocument()
    expect(screen.getByText('The platform is committed to continuous improvement, both in skills and as a community resource.')).toBeInTheDocument()
    
    expect(screen.getByText('Integrity and Fairness')).toBeInTheDocument()
    expect(screen.getByText('Teach Niche operates with transparency and ensures equitable opportunities for all community members.')).toBeInTheDocument()
    
    expect(screen.getByText('Sustainability')).toBeInTheDocument()
    expect(screen.getByText('The platform supports long-term growth for kendama enthusiasts and professionals alike.')).toBeInTheDocument()
  })
})
