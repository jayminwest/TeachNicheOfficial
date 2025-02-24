import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LessonForm } from '../lesson-form'

jest.mock('@uiw/react-md-editor')
jest.mock('../video-uploader', () => ({
  VideoUploader: () => <div data-testid="video-uploader">Video Uploader</div>
}))

describe('LessonForm', () => {
  const mockSubmit = jest.fn()

  beforeEach(() => {
    mockSubmit.mockClear()
  })

  it('renders all form fields', () => {
    render(<LessonForm onSubmit={mockSubmit} />)

    expect(screen.getByLabelText(/lesson title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByTestId('md-editor')).toBeInTheDocument()
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
    expect(screen.getByTestId('video-uploader')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<LessonForm onSubmit={mockSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /create lesson/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      expect(screen.getByText(/description must be at least/i)).toBeInTheDocument()
      expect(screen.getByText(/content is required/i)).toBeInTheDocument()
    })

    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    render(<LessonForm onSubmit={mockSubmit} />)

    await userEvent.type(screen.getByLabelText(/lesson title/i), 'Test Lesson')
    await userEvent.type(screen.getByLabelText(/description/i), 'This is a test lesson description that meets the minimum length')
    
    const mdEditor = screen.getByTestId('md-editor').querySelector('textarea')
    await userEvent.type(mdEditor!, 'Test content')
    
    await userEvent.type(screen.getByLabelText(/price/i), '9.99')

    const submitButton = screen.getByRole('button', { name: /create lesson/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        title: 'Test Lesson',
        description: 'This is a test lesson description that meets the minimum length',
        content: 'Test content',
        price: 9.99,
        muxAssetId: '',
        muxPlaybackId: ''
      })
    })
  })

  it('handles submitting state', () => {
    render(<LessonForm onSubmit={mockSubmit} isSubmitting={true} />)
    
    expect(screen.getByText(/creating lesson/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating lesson/i })).toBeDisabled()
  })
})
