import { render, screen } from '@testing-library/react';
import AuthPage from '@/app/auth/page';

// Mock the AuthClient component that's used inside the Suspense boundary
jest.mock('@/app/auth/client', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="client-auth-wrapper">Mocked Auth Client</div>
  };
});

describe('AuthPage', () => {
  it('renders the auth page with suspense boundary', () => {
    render(<AuthPage />);
    
    // Check that the page title is rendered
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Sign in to access your account and lessons')).toBeInTheDocument();
    
    // Instead of checking for the client wrapper (which is inside Suspense),
    // check for the fallback content which is definitely rendered during the test
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });
  
  it('renders noscript message for users without JavaScript', () => {
    render(<AuthPage />);
    
    // Check that the noscript message is in the document
    const noscriptContent = document.querySelector('noscript');
    expect(noscriptContent).toBeInTheDocument();
  });
});
