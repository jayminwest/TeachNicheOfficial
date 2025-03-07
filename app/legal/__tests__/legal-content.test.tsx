import { render, screen } from '@testing-library/react'
import LegalContent from '../legal-content'

describe('LegalContent', () => {
  it('renders the main heading', () => {
    render(<LegalContent />)
    
    const heading = screen.getByText('Teach Niche Legal Information')
    expect(heading).toBeInTheDocument()
  })

  it('renders the Terms of Service section', () => {
    render(<LegalContent />)
    
    // Check section heading
    const termsHeading = screen.getByText('Terms of Service')
    expect(termsHeading).toBeInTheDocument()
    
    // Check for key subsections
    expect(screen.getByText('1. Acceptance of Terms')).toBeInTheDocument()
    expect(screen.getByText('2. Amendments to the Terms')).toBeInTheDocument()
    expect(screen.getByText('3. Platform Purpose and User Representations')).toBeInTheDocument()
    expect(screen.getByText('4. User Categories and Responsibilities')).toBeInTheDocument()
    expect(screen.getByText('5. Intellectual Property Rights')).toBeInTheDocument()
    expect(screen.getByText('6. Disclaimer of Warranties')).toBeInTheDocument()
    expect(screen.getByText('7. Payment Processing')).toBeInTheDocument()
  })

  it('renders the Privacy Policy section', () => {
    render(<LegalContent />)
    
    // Check section heading
    const privacyHeading = screen.getByText('Privacy Policy')
    expect(privacyHeading).toBeInTheDocument()
    
    // Check for key subsections
    expect(screen.getByText('8. Data Privacy and Security')).toBeInTheDocument()
    expect(screen.getByText('9. Cookie Policy')).toBeInTheDocument()
  })

  it('renders the Additional Legal Information section', () => {
    render(<LegalContent />)
    
    // Check section heading
    const legalHeading = screen.getByText('Additional Legal Information')
    expect(legalHeading).toBeInTheDocument()
    
    // Check for key subsections
    expect(screen.getByText('10. Governing Law and Dispute Resolution')).toBeInTheDocument()
    expect(screen.getByText('11. Indemnification')).toBeInTheDocument()
    expect(screen.getByText('12. Termination')).toBeInTheDocument()
    expect(screen.getByText('13. Severability')).toBeInTheDocument()
    expect(screen.getByText('14. Contact Information')).toBeInTheDocument()
  })

  it('renders the contact email with correct link', () => {
    render(<LegalContent />)
    
    const emailLink = screen.getByText('info@teach-niche.com')
    expect(emailLink).toBeInTheDocument()
    expect(emailLink).toHaveAttribute('href', 'mailto:info@teach-niche.com')
    expect(emailLink).toHaveClass('text-primary hover:underline')
  })

  it('renders all three main sections', () => {
    render(<LegalContent />)
    
    // Check that all three main sections are present
    const sections = [
      screen.getByText('Terms of Service'),
      screen.getByText('Privacy Policy'),
      screen.getByText('Additional Legal Information')
    ]
    
    sections.forEach(section => {
      expect(section).toBeInTheDocument()
    })
  })
})
