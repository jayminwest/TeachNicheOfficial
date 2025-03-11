import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '../error-page';

describe('ErrorPage', () => {
  const mockError = new Error('Test error');
  const mockReset = jest.fn();

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Mock console.error to prevent test output pollution
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    jest.restoreAllMocks();
  });

  it('renders error message correctly', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    // Check for main elements
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to home/i })).toBeInTheDocument();
  });

  it('logs error to console', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    // Verify console.error was called with the error
    expect(console.error).toHaveBeenCalledWith('Error occurred:', mockError);
  });

  it('calls reset function when try again button is clicked', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    // Click the try again button
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    
    // Verify reset function was called
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('has correct link to home page', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    
    // Check that the home link has the correct href
    const homeLink = screen.getByRole('link', { name: /return to home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders with error digest if present', () => {
    const errorWithDigest = new Error('Test error') as Error & { digest: string };
    errorWithDigest.digest = 'error-digest-123';
    
    render(<ErrorPage error={errorWithDigest} reset={mockReset} />);
    
    // Basic assertions to ensure the component renders
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Verify console.error was called with the error containing digest
    expect(console.error).toHaveBeenCalledWith('Error occurred:', errorWithDigest);
  });
});
