import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownEditor } from '../markdown-editor'
import { ThemeProvider } from 'next-themes'

jest.mock('@uiw/react-md-editor')

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

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
    
    const editor = screen.getByTestId('md-editor')
    expect(editor).toBeInTheDocument()
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

    const editorWrapper = screen.getByTestId('md-editor-wrapper')
    expect(editorWrapper).toHaveClass('!cursor-not-allowed')
    const toolbar = screen.queryByRole('toolbar')
    expect(toolbar).not.toBeInTheDocument()
  })

  it('calls onChange when content changes', async () => {
    render(
      <ThemeProvider>
        <MarkdownEditor
          value="Test content"
          onChange={mockOnChange}
        />
      </ThemeProvider>
    )

    const textarea = screen.getByTestId('md-editor').querySelector('textarea')
    await userEvent.type(textarea!, 'New content')
    
    expect(mockOnChange).toHaveBeenCalled()
  })
})
