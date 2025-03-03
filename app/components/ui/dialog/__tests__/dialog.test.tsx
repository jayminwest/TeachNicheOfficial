import { render, screen, fireEvent } from '@testing-library/react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../dialog'

describe('Dialog', () => {
  it('opens and closes dialog with content', () => {
    const onOpenChange = jest.fn()
    
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Test Description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()

    // Click close button
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders with visually hidden title for accessibility', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle className="sr-only">Hidden Title</DialogTitle>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    )

    // The title should be in the document but not visible
    const title = screen.getByText('Hidden Title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveClass('sr-only')
  })
})
