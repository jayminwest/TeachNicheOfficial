import { render, screen } from '@testing-library/react';
import AuthPage from '@/app/auth/page';

// Mock the AuthClient component that's used inside the Suspense boundary
jest.mock('@/app/auth/client', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="client-auth-wrapper">Mocked Auth Client</div>
  };
});

// Mock React's Suspense to immediately render children instead of fallback
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    Suspense: ({ children }) => children
  };
});

describe('AuthPage', () => {
  it('renders the auth page with suspense boundary', () => {
    render(<AuthPage />);
    
    // Check that the page title is rendered
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Sign in to access your account and lessons')).toBeInTheDocument();
    
    // Check for the client component which should be rendered since we're mocking Suspense
    expect(screen.getByTestId('client-auth-wrapper')).toBeInTheDocument();
  });
  
  it('renders noscript message for users without JavaScript', () => {
    render(<AuthPage />);
    
    // Check that the noscript message is in the document
    const noscriptContent = document.querySelector('noscript');
    expect(noscriptContent).toBeInTheDocument();
  });
});
