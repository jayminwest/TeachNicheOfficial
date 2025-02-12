import { render, screen } from '../../test-utils'
import { Features } from '@/components/ui/features'

describe('Features', () => {
  it('renders the features section', () => {
    render(<Features />)
    
    // Check for the main heading
    expect(screen.getByText('Why Choose Teach Niche?')).toBeInTheDocument()
    
    // You can add more specific tests based on your features content
  })
})
