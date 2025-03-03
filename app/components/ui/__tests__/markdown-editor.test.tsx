import React from 'react'
import { render, screen, act } from '@testing-library/react'
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

  it('renders correctly', async () => {
    render(
      <ThemeProvider>
        <MarkdownEditor 
          value="Test content" 
          onChange={mockOnChange}
        />
      </ThemeProvider>
    )
    
    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    const editor = screen.getByTestId('md-editor')
    expect(editor).toBeInTheDocument()
  })

  it('handles disabled state', async () => {
    render(
      <ThemeProvider>
        <MarkdownEditor
          value="Test content"
          onChange={mockOnChange}
          disabled={true}
        />
      </ThemeProvider>
    )

    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

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

    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    const textarea = screen.getByTestId('md-editor').querySelector('textarea')
    await userEvent.type(textarea!, 'New content')
    
    expect(mockOnChange).toHaveBeenCalled()
  })
})
