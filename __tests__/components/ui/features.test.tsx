import { render, screen, act } from '../../test-utils'
import { Features } from '@/components/ui/features'
import { supabase } from '@/lib/supabase'

// Mock Supabase auth
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn((callback) => {
        callback('SIGNED_OUT', null)
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })
    }
  }
}))

describe('Features', () => {
  it('renders the features section', async () => {
    await act(async () => {
      render(<Features />)
    })
    
    // Check for the main heading
    expect(screen.getByText('Why Choose Teach Niche?')).toBeInTheDocument()
    
    // You can add more specific tests based on your features content
  })
})
