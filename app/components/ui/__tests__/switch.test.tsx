import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../switch';

describe('Switch Component', () => {
  it('renders correctly with default props', () => {
    render(<Switch data-testid="test-switch" />);
    const switchElement = screen.getByTestId('test-switch');
    
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveClass('peer inline-flex h-6 w-11');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
  });

  it('applies custom className correctly', () => {
    render(<Switch className="custom-class" data-testid="test-switch" />);
    const switchElement = screen.getByTestId('test-switch');
    
    expect(switchElement).toHaveClass('custom-class');
    expect(switchElement).toHaveClass('peer inline-flex h-6 w-11');
  });

  it('can be checked and unchecked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    
    render(
      <Switch 
        data-testid="test-switch" 
        onCheckedChange={onCheckedChange}
      />
    );
    
    const switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    
    await user.click(switchElement);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    
    // Since we're not controlling the state in this test,
    // we can't assert the checked state changes without a controlled component
  });

  it('renders in disabled state correctly', () => {
    render(<Switch disabled data-testid="test-switch" />);
    const switchElement = screen.getByTestId('test-switch');
    
    expect(switchElement).toBeDisabled();
    expect(switchElement).toHaveClass('disabled:opacity-50');
  });

  it('passes additional props to the underlying element', () => {
    render(
      <Switch 
        data-testid="test-switch"
        aria-label="Toggle feature"
      />
    );
    
    const switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toHaveAttribute('aria-label', 'Toggle feature');
  });
});
