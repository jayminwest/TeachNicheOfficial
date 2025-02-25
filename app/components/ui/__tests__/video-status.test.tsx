import { render, screen } from '@testing-library/react';
import { VideoStatus } from '../video-status';

describe('VideoStatus', () => {
  it('displays correct pending state', () => {
    render(<VideoStatus status="pending" />);
    
    expect(screen.getByText('Waiting to process...')).toBeInTheDocument();
    // Find the Loader2 icon by its role and class
    const loaderIcon = screen.getByText('Waiting to process...').previousSibling;
    expect(loaderIcon).toHaveClass('animate-spin');
  });

  it('shows processing state', () => {
    render(<VideoStatus status="processing" />);
    
    expect(screen.getByText('Processing video...')).toBeInTheDocument();
    const loaderIcon = screen.getByText('Processing video...').previousSibling;
    expect(loaderIcon).toHaveClass('animate-spin');
    expect(loaderIcon).toHaveClass('text-blue-500');
  });

  it('indicates ready state', () => {
    render(<VideoStatus status="ready" />);
    
    expect(screen.getByText('Video ready')).toBeInTheDocument();
    const checkIcon = screen.getByText('Video ready').previousSibling;
    expect(checkIcon).toHaveClass('text-green-500');
  });

  it('handles error state with default message', () => {
    render(<VideoStatus status="error" />);
    
    expect(screen.getByText('Error processing video')).toBeInTheDocument();
    const alertIcon = screen.getByText('Error processing video').previousSibling;
    expect(alertIcon).toHaveClass('text-destructive');
  });

  it('displays custom error message when provided', () => {
    const errorMessage = 'Custom error message';
    render(<VideoStatus status="error" error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(<VideoStatus status="ready" className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('items-center');
  });
});
