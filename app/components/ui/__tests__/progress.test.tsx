import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '../progress';

describe('Progress Component', () => {
  it('renders with default props', () => {
    render(<Progress value={0} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveClass('relative h-4 w-full overflow-hidden rounded-full bg-secondary');
  });

  it('renders with custom value', () => {
    render(<Progress value={50} />);
    const progressBar = screen.getByRole('progressbar');
    const indicator = progressBar.firstChild;
    expect(progressBar).toBeInTheDocument();
    expect(indicator).toHaveStyle('transform: translateX(-50%)');
  });

  it('renders with custom className', () => {
    render(<Progress value={25} className="custom-class" />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveClass('custom-class');
  });

  it('renders with value of 100', () => {
    render(<Progress value={100} />);
    const progressBar = screen.getByRole('progressbar');
    const indicator = progressBar.firstChild;
    expect(progressBar).toBeInTheDocument();
    expect(indicator).toHaveStyle('transform: translateX(-0%)');
  });

  it('handles undefined value by defaulting to 0', () => {
    render(<Progress />);
    const progressBar = screen.getByRole('progressbar');
    const indicator = progressBar.firstChild;
    expect(progressBar).toBeInTheDocument();
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('passes additional props to the underlying element', () => {
    render(<Progress value={50} data-testid="custom-progress" aria-label="Loading progress" />);
    const progressBar = screen.getByTestId('custom-progress');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-label', 'Loading progress');
  });
});
