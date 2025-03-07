import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { getSession, onAuthStateChange } from '../supabaseAuth';
import { createOrUpdateProfile } from '../../profile/profileService';

jest.mock('../supabaseAuth', () => ({
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
}));

jest.mock('../../profile/profileService', () => ({
  createOrUpdateProfile: jest.fn(),
}));

// Test component to access auth context
function TestComponent() {
  const { user, isLoading, isAuthenticated, error } = useAuth();
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="error">{error ? error.message : 'no-error'}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default mock implementations
    (getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    });
    
    (onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
    
    (createOrUpdateProfile as jest.Mock).mockResolvedValue({
      data: null,
      error: null,
      success: true
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });
  
  it('sets user when session exists', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    (getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for the session check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toContain('test-user-id');
    expect(createOrUpdateProfile).toHaveBeenCalledWith(mockUser);
  });
  
  it('handles session errors', async () => {
    const mockError = new Error('Session error');
    (getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: mockError
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for the session check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('Session error');
  });
  
  it('handles safety timeout correctly', async () => {
    // Make getSession never resolve to simulate a hanging request
    (getSession as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');
    
    // Fast-forward past the timeout
    act(() => {
      jest.advanceTimersByTime(10000); // 10 seconds
    });
    
    // Should no longer be loading after timeout
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });
  
  it('updates state on auth state changes', async () => {
    let authChangeCallback: any;
    
    // Capture the callback function
    (onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: jest.fn() } }
      };
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(onAuthStateChange).toHaveBeenCalled();
    });
    
    // Simulate auth state change
    act(() => {
      authChangeCallback('SIGNED_IN', { 
        user: { id: 'new-user-id', email: 'new@example.com' } 
      });
    });
    
    // Wait for state update
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toContain('new-user-id');
    });
    
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(createOrUpdateProfile).toHaveBeenCalledWith({ 
      id: 'new-user-id', 
      email: 'new@example.com' 
    });
  });
  
  it('cleans up subscription on unmount', async () => {
    const mockUnsubscribe = jest.fn();
    (onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    });
    
    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Unmount the component
    unmount();
    
    // Subscription should be cleaned up
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
