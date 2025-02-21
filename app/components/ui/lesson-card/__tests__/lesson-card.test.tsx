import { render, screen, fireEvent } from '@testing-library/react'
import { LessonCard } from '@/app/components/ui/lesson-card'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { src: string; alt: string; fill?: boolean; className?: string }) => (
    <img src={props.src} alt={props.alt} className={props.className} />
  )
}))

// Mock LessonCheckout
jest.mock('@/app/components/ui/lesson-checkout', () => ({
  LessonCheckout: () => <button>Purchase</button>
}))

// Mock LessonPreviewDialog
jest.mock('@/app/components/ui/lesson-preview-dialog', () => ({
  LessonPreviewDialog: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div role="dialog">Dialog Content</div> : null
}))

describe('LessonCard', () => {
  it('renders lesson card and opens preview dialog on click', () => {
    const mockLesson = {
      id: '1',
      title: 'Test Lesson',
      description: 'Test Description',
      price: 29.99,
      thumbnailUrl: '/test-image.jpg',
      averageRating: 4.5,
      totalRatings: 100
    }

    render(<LessonCard lesson={mockLesson} />)

    // Check initial render
    expect(screen.getByText('Test Lesson')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Purchase' })).toBeInTheDocument()

    // Dialog should not be visible initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Click card to open dialog
    fireEvent.click(screen.getByText('Test Lesson'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
