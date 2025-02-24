import { render, screen, waitFor } from '@testing-library/react'
import { LessonAccessGate } from '@/app/components/ui/lesson-access-gate'
import { useLessonAccess } from '@/app/hooks/use-lesson-access'
import { mockPurchaseStatus } from '../../utils/test-utils'

// Mock the useLessonAccess hook
jest.mock('@/app/hooks/use-lesson-access')
const mockUseLessonAccess = useLessonAccess as jest.MockedFunction<typeof useLessonAccess>

describe('LessonAccessGate', () => {
  const defaultProps = {
    lessonId: 'test-lesson',
    children: <div>Protected Content</div>,
    price: 9.99
  }

  beforeEach(() => {
    mockUseLessonAccess.mockClear()
  })

  it('should show loading state', () => {
    mockUseLessonAccess.mockReturnValue({
      loading: true,
      hasAccess: false,
      error: null,
      purchaseStatus: 'none'
    })

    render(<LessonAccessGate {...defaultProps} />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should render children when access is granted', async () => {
    mockUseLessonAccess.mockReturnValue({
      loading: false,
      hasAccess: true,
      error: null,
      ...mockPurchaseStatus('completed')
    })

    render(<LessonAccessGate {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('should show purchase option when access is denied', async () => {
    mockUseLessonAccess.mockReturnValue({
      loading: false,
      hasAccess: false,
      error: null,
      ...mockPurchaseStatus('none')
    })

    render(<LessonAccessGate {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Purchase Required')).toBeInTheDocument()
      expect(screen.getByText(/Purchase Lesson/)).toBeInTheDocument()
    })
  })

  it('should handle errors gracefully', async () => {
    mockUseLessonAccess.mockReturnValue({
      loading: false,
      hasAccess: false,
      error: new Error('Access check failed')
    })

    render(<LessonAccessGate {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Access check failed')).toBeInTheDocument()
    })
  })
})
