import { render, screen, fireEvent } from '@testing-library/react'
import { LessonCard } from '../lesson-card'

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

    expect(screen.getByText('Test Lesson')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()

    // Click card to open dialog
    fireEvent.click(screen.getByText('Test Lesson'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
