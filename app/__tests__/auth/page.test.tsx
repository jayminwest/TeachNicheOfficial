import { render, screen } from '@testing-library/react';
import AuthPage from '@/app/auth/page';

// Mock the ClientAuthWrapper component
jest.mock('@/app/auth/client-auth-wrapper', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="client-auth-wrapper">Mocked Client Auth Wrapper</div>
  };
});

describe('AuthPage', () => {
  it('renders the auth page with suspense boundary', () => {
    render(<AuthPage />);
    
    // Check that the page title is rendered
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Sign in to access your account and lessons')).toBeInTheDocument();
    
    // Check that the client wrapper is rendered (this means Suspense worked)
    expect(screen.getByTestId('client-auth-wrapper')).toBeInTheDocument();
  });
  
  it('renders noscript message for users without JavaScript', () => {
    render(<AuthPage />);
    
    // Check that the noscript message is in the document
    const noscriptContent = document.querySelector('noscript');
    expect(noscriptContent).toBeInTheDocument();
  });
});
