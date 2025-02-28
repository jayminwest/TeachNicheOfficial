import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock Firebase auth
jest.mock('@/app/lib/firebase', () => ({
  app: {},
  getAuth: jest.fn(() => null)
}));

jest.mock('firebase/auth', () => {
  const authStateListeners = new Set();
  let currentUser = null;
  
  return {
    getAuth: jest.fn(),
    onAuthStateChanged: jest.fn((auth, callback) => {
      // Store the callback to simulate auth state changes
      authStateListeners.add(callback);
      // Immediately call with current user
      callback(currentUser);
      
      // Return unsubscribe function
      return () => {
        authStateListeners.delete(callback);
      };
    }),
    // Helper to simulate auth state changes in tests
    __simulateAuthStateChange: (user) => {
      currentUser = user;
      authStateListeners.forEach(callback => callback(user));
    }
  };
});

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, isAuthenticated } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should provide initial auth state to components', async () => {
    // Arrange & Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Assert - initially loading
    expect(screen.getByTestId('loading').textContent).toBe('Loading');
    
    // Wait for auth state to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Assert - finished loading, no user
    expect(screen.getByTestId('loading').textContent).toBe('Not Loading');
    expect(screen.getByTestId('user').textContent).toBe('No User');
    expect(screen.getByTestId('authenticated').textContent).toBe('Not Authenticated');
  });
  
  it('should update when user signs in', async () => {
    // Arrange
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Act - simulate user sign in
    await act(async () => {
      const { __simulateAuthStateChange } = require('firebase/auth');
      __simulateAuthStateChange({ uid: '123', email: 'test@example.com' });
    });
    
    // Assert - user is now signed in
    expect(screen.getByTestId('loading').textContent).toBe('Not Loading');
    expect(screen.getByTestId('user').textContent).toBe('test@example.com');
    expect(screen.getByTestId('authenticated').textContent).toBe('Authenticated');
  });
  
  it('should update when user signs out', async () => {
    // Arrange - start with signed in user
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Simulate initial signed in state
    await act(async () => {
      const { __simulateAuthStateChange } = require('firebase/auth');
      __simulateAuthStateChange({ uid: '123', email: 'test@example.com' });
    });
    
    // Verify user is signed in
    expect(screen.getByTestId('authenticated').textContent).toBe('Authenticated');
    
    // Act - simulate user sign out
    await act(async () => {
      const { __simulateAuthStateChange } = require('firebase/auth');
      __simulateAuthStateChange(null);
    });
    
    // Assert - user is now signed out
    expect(screen.getByTestId('loading').textContent).toBe('Not Loading');
    expect(screen.getByTestId('user').textContent).toBe('No User');
    expect(screen.getByTestId('authenticated').textContent).toBe('Not Authenticated');
  });
});
