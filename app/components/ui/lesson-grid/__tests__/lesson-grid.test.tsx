import { render, screen } from '@testing-library/react'
import { LessonGrid } from '@/app/components/ui/lesson-grid'

// Mock LessonCard component
jest.mock('@/app/components/ui/lesson-card', () => ({
  LessonCard: ({ lesson }: { lesson: any }) => (
    <div data-testid="lesson-card">
      <h3>{lesson.title}</h3>
      <p>{lesson.description}</p>
    </div>
  )
}))

describe('LessonGrid', () => {
  it('renders grid with multiple lessons', () => {
    const mockLessons = [
      {
        id: '1',
        title: 'Lesson 1',
        description: 'Description 1',
        price: 29.99,
        created_at: '2024-01-01',
        thumbnailUrl: '/test1.jpg',
        averageRating: 4.5,
        totalRatings: 100
      },
      {
        id: '2',
        title: 'Lesson 2',
        description: 'Description 2',
        price: 39.99,
        created_at: '2024-01-02',
        thumbnailUrl: '/test2.jpg',
        averageRating: 4.7,
        totalRatings: 200
      }
    ]

    render(<LessonGrid lessons={mockLessons} />)

    // Check if both lessons are rendered
    expect(screen.getByText('Lesson 1')).toBeInTheDocument()
    expect(screen.getByText('Lesson 2')).toBeInTheDocument()
    expect(screen.getAllByTestId('lesson-card')).toHaveLength(2)
  })
})
