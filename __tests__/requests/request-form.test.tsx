import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestForm } from '@/app/requests/components/request-form'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/auth/AuthContext'
import { supabase } from '@/lib/supabase'

// Mock dependencies
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn()
}))
jest.mock('@/auth/AuthContext', () => ({
  useAuth: jest.fn()
}))
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

describe('RequestForm', () => {
  const mockUser = { id: 'test-user-id' }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser })
  })

  it('renders all form fields', () => {
    render(<RequestForm />)
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument()
  })

  it('disables submit button when not logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null })
    render(<RequestForm />)
    
    const submitButton = screen.getByRole('button', { name: /submit request/i })
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveAttribute('title', 'Please log in to submit a request')
  })

  it('handles form submission successfully', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      data: { id: '123', title: 'Test Request' },
      error: null
    }
    
    ;(supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    })

    render(<RequestForm />)

    await user.type(screen.getByLabelText(/title/i), 'Test Request')
    await user.type(screen.getByLabelText(/description/i), 'Test Description that is long enough')
    await user.selectOptions(screen.getByLabelText(/category/i), 'Beginner Fundamentals')
    
    await user.click(screen.getByRole('button', { name: /submit request/i }))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Success",
        description: "Your request has been submitted successfully."
      })
    })
  })

  it('handles submission errors', async () => {
    const user = userEvent.setup()
    const mockError = { message: 'Database error' }
    
    ;(useAuth as jest.Mock).mockReturnValue({ user: { id: 'test-user' } })
    ;(supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(mockError)
        })
      })
    })

    render(<RequestForm />)

    await user.type(screen.getByLabelText(/title/i), 'Test Request')
    await user.type(screen.getByLabelText(/description/i), 'Test Description that is long enough')
    await user.selectOptions(screen.getByLabelText(/category/i), 'Beginner Fundamentals')
    
    await user.click(screen.getByRole('button', { name: /submit request/i }))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Database error",
        variant: "destructive"
      })
    })
  })
})
