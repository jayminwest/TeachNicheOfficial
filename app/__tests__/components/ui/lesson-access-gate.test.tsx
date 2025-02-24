import { render, screen } from '@testing-library/react'
import { LessonAccessGate } from '@/app/components/ui/lesson-access-gate'
import { useLessonAccess } from '@/app/hooks/use-lesson-access'

// Mock the useLessonAccess hook
jest.mock('@/app/hooks/use-lesson-access')
const mockUseLessonAccess = useLessonAccess as jest.MockedFunction<typeof useLessonAccess>

// Mock the LessonCheckout component since we don't need to test its internals
jest.mock('@/app/components/ui/lesson-checkout', () => ({
  LessonCheckout: () => <div>Purchase Lesson</div>
}))

describe('LessonAccessGate', () => {
  const defaultProps = {
    lessonId: 'test-lesson',
    children: <div>Protected Content</div>,
    price: 9.99
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    mockUseLessonAccess.mockReturnValue({
      loading: true,
      hasAccess: false,
      error: null,
      purchaseStatus: 'none'
    })

    render(<LessonAccessGate {...defaultProps} />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows content when access is granted', () => {
    mockUseLessonAccess.mockReturnValue({
      loading: false,
      hasAccess: true,
      error: null,
      purchaseStatus: 'completed'
    })

    render(<LessonAccessGate {...defaultProps} />)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows purchase UI when access is denied', () => {
    mockUseLessonAccess.mockReturnValue({
      loading: false,
      hasAccess: false,
      error: null,
      purchaseStatus: 'none'
    })

    render(<LessonAccessGate {...defaultProps} />)
    expect(screen.getByText('Purchase Required')).toBeInTheDocument()
    expect(screen.getByText('Purchase Lesson')).toBeInTheDocument()
  })

  it('shows error message on failure', () => {
    const errorMessage = 'Access check failed'
    mockUseLessonAccess.mockReturnValue({
      loading: false,
      hasAccess: false,
      error: new Error(errorMessage),
      purchaseStatus: 'none'
    })

    render(<LessonAccessGate {...defaultProps} />)
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })
})
