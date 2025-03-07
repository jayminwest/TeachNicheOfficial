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
    expect(screen.getByText('Sorry, a critical error has occurred.')).toBeInTheDocument();
  });

  it('calls reset function when "Try again" button is clicked', () => {
    render(<GlobalError error={new Error('Test error')} reset={mockReset} />);
    
    // Find and click the reset button
    const resetButton = screen.getByText('Try again');
    fireEvent.click(resetButton);
    
    // Verify the reset function was called
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders a link to the home page', () => {
    render(<GlobalError error={new Error('Test error')} reset={mockReset} />);
    
    // Check if the home link is present with correct attributes
    const homeLink = screen.getByText('Return to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute('href')).toBe('/');
  });

  it('renders with the correct styling', () => {
    render(<GlobalError error={new Error('Test error')} reset={mockReset} />);
    
    // Check if the container has the expected styles
    const container = screen.getByText('Something went wrong').parentElement;
    expect(container).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem',
      textAlign: 'center'
    });
  });
});
