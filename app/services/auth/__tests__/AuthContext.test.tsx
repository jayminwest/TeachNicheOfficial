import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { onAuthStateChanged } from 'firebase/auth';

// Use Jest's testing functions
const { describe, it, expect, beforeEach } = global;

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn()
}));

const TestComponent = () => {
  const { user, loading } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle auth state changes', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    
    // Delay the auth callback to ensure we can test the loading state
    let authCallback: ((user: any) => void) | null = null;
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      authCallback = callback;
      // Don't call the callback immediately
      return () => {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Now loading should be true
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    
    // Simulate auth state change
    await act(async () => {
      if (authCallback) authCallback(mockUser);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // After auth state change, loading should be false
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
  });

  it('should handle no authenticated user', async () => {
    // Delay the auth callback to ensure we can test the loading state
    let authCallback: ((user: any) => void) | null = null;
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      authCallback = callback;
      // Don't call the callback immediately
      return () => {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // Simulate auth state change with null user
    await act(async () => {
      if (authCallback) authCallback(null);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // After auth state change, loading should be false and no user
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });
});
