import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownEditor } from '../markdown-editor'
import { ThemeProvider } from 'next-themes'

describe('MarkdownEditor', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders correctly', () => {
    render(
      <ThemeProvider>
        <MarkdownEditor 
          value="Test content" 
          onChange={mockOnChange}
        />
      </ThemeProvider>
    )
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    render(
      <ThemeProvider>
        <MarkdownEditor
          value="Test content"
          onChange={mockOnChange}
          disabled={true}
        />
      </ThemeProvider>
    )

    const editor = screen.getByRole('textbox')
    expect(editor).toHaveAttribute('readonly')
  })
})
