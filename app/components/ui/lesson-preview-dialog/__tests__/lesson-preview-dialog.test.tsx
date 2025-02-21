import { render, screen } from '@testing-library/react'
import { LessonPreviewDialog } from '../lesson-preview-dialog'

describe('LessonPreviewDialog', () => {
  it('renders dialog with lesson details when open', () => {
    const mockLesson = {
      id: '1',
      title: 'Test Lesson',
      description: 'Test Description',
      price: 29.99,
      thumbnailUrl: '/test-image.jpg',
      averageRating: 4.5,
      totalRatings: 100
    }

    render(
      <LessonPreviewDialog 
        lesson={mockLesson}
        isOpen={true}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Test Lesson')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(100 ratings)')).toBeInTheDocument()
  })
})
