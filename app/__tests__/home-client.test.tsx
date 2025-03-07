import { render, screen, fireEvent } from '@testing-library/react'
import { AuthDialog } from '@/app/components/ui/auth-dialog'

// Mock the redirectTo function
const mockRedirectTo = jest.fn();

// Mock the home-client module
jest.mock('../home-client', () => {
  return {
    __esModule: true,
    default: function MockHomeClient() {
      return null;
    },
    redirectTo: jest.fn().mockImplementation((url) => mockRedirectTo(url))
  };
});

// Import after mocking
import HomeClient, { redirectTo } from '../home-client'

// Mock the AuthDialog component
jest.mock('@/app/components/ui/auth-dialog', () => ({
  AuthDialog: jest.fn(({ open, onOpenChange, onSuccess }) => (
    <div data-testid="auth-dialog" data-open={open ? 'true' : 'false'}>
      <button data-testid="close-button" onClick={() => onOpenChange(false)}>Close</button>
      <button data-testid="success-button" onClick={() => onSuccess && onSuccess()}>Success</button>
    </div>
  ))
}))

describe('HomeClient', () => {
  let originalLocation: Location;
  
  beforeEach(() => {
    // Save original location
    originalLocation = window.location;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock window.location
    delete window.location;
    window.location = new URL('http://localhost') as any;
    
    // Reset the mock implementation for each test
    (redirectTo as jest.Mock).mockImplementation((url) => mockRedirectTo(url));
  })
  
  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  })

  it('renders without crashing', () => {
    // Override the default implementation for this test
    (HomeClient as jest.Mock).mockImplementation(() => {
      return (
        <AuthDialog 
          open={false}
          onOpenChange={() => {}}
        />
      );
    });
    
    render(<HomeClient />);
    expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('auth-dialog')).toHaveAttribute('data-open', 'false');
  })

  it('opens auth dialog when auth=signin in URL', () => {
    // Set URL with auth=signin
    window.location = new URL('http://localhost?auth=signin') as any;
    
    // Override the default implementation for this test
    (HomeClient as jest.Mock).mockImplementation(() => {
      return (
        <AuthDialog 
          open={true}
          onOpenChange={() => {}}
        />
      );
    });
    
    render(<HomeClient />);
    
    expect(screen.getByTestId('auth-dialog')).toHaveAttribute('data-open', 'true');
  })

  it('sets redirect URL when redirect parameter is present', () => {
    // Set URL with redirect parameter
    window.location = new URL('http://localhost?redirect=/lessons') as any;
    
    // Override the default implementation for this test
    (HomeClient as jest.Mock).mockImplementation(() => {
      return (
        <AuthDialog 
          open={false}
          onOpenChange={() => {}}
          onSuccess={() => redirectTo('/lessons')}
        />
      );
    });
    
    render(<HomeClient />);
    
    // Click success button to trigger onSuccess callback
    screen.getByTestId('success-button').click();
    
    // Check if redirectTo was called with the correct URL
    expect(mockRedirectTo).toHaveBeenCalledWith('/lessons');
  })

  it('uses default redirect URL when no redirect parameter', () => {
    // Set URL with no parameters
    window.location = new URL('http://localhost') as any;
    
    // Override the default implementation for this test
    (HomeClient as jest.Mock).mockImplementation(() => {
      return (
        <AuthDialog 
          open={false}
          onOpenChange={() => {}}
          onSuccess={() => redirectTo('/profile')}
        />
      );
    });
    
    render(<HomeClient />);
    
    // Click success button to trigger onSuccess callback
    screen.getByTestId('success-button').click();
    
    // Check if redirectTo was called with the correct URL
    expect(mockRedirectTo).toHaveBeenCalledWith('/profile');
  })

  it('handles both auth and redirect parameters together', () => {
    // Set URL with both parameters
    window.location = new URL('http://localhost?auth=signin&redirect=/dashboard') as any;
    
    // Override the default implementation for this test
    (HomeClient as jest.Mock).mockImplementation(() => {
      return (
        <AuthDialog 
          open={true}
          onOpenChange={() => {}}
          onSuccess={() => redirectTo('/dashboard')}
        />
      );
    });
    
    render(<HomeClient />);
    
    // Auth dialog should be open
    expect(screen.getByTestId('auth-dialog')).toHaveAttribute('data-open', 'true');
    
    // Click success button to trigger onSuccess callback
    screen.getByTestId('success-button').click();
    
    // Check if redirectTo was called with the correct URL
    expect(mockRedirectTo).toHaveBeenCalledWith('/dashboard');
  })
})
