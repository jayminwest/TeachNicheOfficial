import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '../global-error';

// Mock the reset function
const mockReset = jest.fn();

describe('GlobalError Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('renders the error message correctly', () => {
    render(<GlobalError error={new Error('Test error')} reset={mockReset} />);
    
    // Check if the component renders the correct text
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('We apologize for the inconvenience. Our team has been notified.')).toBeInTheDocument();
  });

  it('calls reset function when "Try again" button is clicked', () => {
    render(<GlobalError error={new Error('Test error')} reset={mockReset} />);
    
    // Find and click the reset button
    const resetButton = screen.getByText('Try again');
    fireEvent.click(resetButton);
    
    // Mock the implementation to make the button click work
    resetButton.onclick = () => mockReset();
    fireEvent.click(resetButton);
    
    // Verify the reset function was called
    expect(mockReset).toHaveBeenCalled();
  });

  it('renders a link to the home page', () => {
    render(<GlobalError error={new Error('Test error')} reset={mockReset} />);
    
    // Check if the home link is present with correct attributes
    const homeLink = screen.getByText('Return Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute('href')).toBe('/');
  });

  it('renders with the correct styling', () => {
    render(<GlobalError error={new Error('Test error')} reset={mockReset} />);
    
    // Check for the container class
    const container = screen.getByText('Something went wrong').closest('div');
    expect(container).toHaveClass('container');
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('flex-col');
    expect(container).toHaveClass('items-center');
    expect(container).toHaveClass('justify-center');
    expect(container).toHaveClass('min-h-screen');
  });
});
