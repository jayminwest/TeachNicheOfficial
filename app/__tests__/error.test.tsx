import { render, screen, fireEvent } from '@testing-library/react';
import Error from '../error';
import React from 'react';

// Mock React's useEffect hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((cb) => cb())
}));

// Mock console.error to prevent test output pollution and to verify it's called
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

describe('Error Component', () => {
  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    mockConsoleError.mockClear();
    jest.clearAllMocks();
  });

  it('renders error message and buttons', () => {
    const mockReset = jest.fn();
    const mockError = new Error('Test error message');
    
    render(<Error error={mockError} reset={mockReset} />);
    
    // Check that the component renders the error UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    
    // Check that buttons are rendered
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
    
    // Verify the error was logged
    expect(mockConsoleError).toHaveBeenCalledWith('Unhandled error:', mockError);
  });

  it('calls reset function when "Try again" button is clicked', () => {
    const mockReset = jest.fn();
    const mockError = new Error('Test error message');
    
    render(<Error error={mockError} reset={mockReset} />);
    
    // Click the reset button
    fireEvent.click(screen.getByText('Try again'));
    
    // Verify reset was called
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders error with digest property', () => {
    const mockReset = jest.fn();
    // Create an error object with digest property using Object.create
    const mockError = Object.create(new Error('Test error message'), {
      digest: { value: 'error-digest-123', configurable: true, enumerable: true, writable: true }
    });
    
    render(<Error error={mockError} reset={mockReset} />);
    
    // Basic assertions to ensure component renders with digest property
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(mockConsoleError).toHaveBeenCalledWith('Unhandled error:', mockError);
  });

  it('has a link to the home page', () => {
    const mockReset = jest.fn();
    const mockError = new Error('Test error message');
    
    render(<Error error={mockError} reset={mockReset} />);
    
    // Check that the home link exists and has the correct href
    const homeLink = screen.getByText('Return to Home');
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
