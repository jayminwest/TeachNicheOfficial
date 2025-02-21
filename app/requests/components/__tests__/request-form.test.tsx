import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestForm } from '@/app/requests/components/request-form'
import { toast } from '@/app/components/ui/use-toast'
import { useAuth } from '@/app/services/auth/AuthContext'
import { supabase } from '@/app/services/supabase'

// Mock dependencies
jest.mock('@/app/components/ui/use-toast')
jest.mock('@/app/services/auth/AuthContext')
jest.mock('@/app/services/supabase')

describe('RequestForm', () => {
  const mockUser = { id: 'test-user-id' }
  
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser })
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
    const mockInsertResponse = {
      data: { id: '123', title: 'Test Request' },
      error: null
    }
    
    ;(supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockInsertResponse)
        })
      })
    })

    render(<RequestForm />)

    await user.type(screen.getByLabelText(/title/i), 'Test Request')
    await user.type(screen.getByLabelText(/description/i), 'Test Description')
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
    
    ;(supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(mockError)
        })
      })
    })

    render(<RequestForm />)

    // Fill in required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Request')
    await user.type(screen.getByLabelText(/description/i), 'Test Description that is long enough')
    await user.selectOptions(screen.getByLabelText(/category/i), 'Beginner Fundamentals')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /submit request/i }))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Error",
        description: expect.any(String),
        variant: "destructive"
      })
    })
  })
})
