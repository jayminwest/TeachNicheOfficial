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
})
