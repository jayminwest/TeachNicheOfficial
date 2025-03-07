import { render, screen } from '@testing-library/react';
import { VideoStatus } from '../video-status';

describe('VideoStatus', () => {
  it('displays correct pending state', () => {
    render(<VideoStatus status="pending" />);
    
    expect(screen.getByText('Waiting to process...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('shows processing state', () => {
    render(<VideoStatus status="processing" />);
    
    expect(screen.getByText('Processing video...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('indicates ready state', () => {
    render(<VideoStatus status="ready" />);
    
    expect(screen.getByText('Video ready')).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('handles error state with default message', () => {
    render(<VideoStatus status="error" />);
    
    expect(screen.getByText('Error processing video')).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
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
