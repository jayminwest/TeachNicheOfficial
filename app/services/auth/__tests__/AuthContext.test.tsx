import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { getSession, onAuthStateChange } from '../supabaseAuth';
import { createOrUpdateProfile } from '../../profile/profileService';

// Mock the dependencies
jest.mock('../supabaseAuth', () => ({
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
}));

jest.mock('../../profile/profileService', () => ({
  createOrUpdateProfile: jest.fn(),
}));

// Test component to access auth context
function TestComponent() {
  const auth = useAuth();
  const { user, isLoading, isAuthenticated, error } = auth;
  
  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="error">{error ? error.message : 'no-error'}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  let mockUnsubscribe: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockUnsubscribe = jest.fn();
    
    // Default mock implementations
    (getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    });
    
    (onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
      error: null
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

  it('initializes with loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially should be in loading state
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('no-user');
    
    // Wait for getSession to resolve
    await waitFor(() => {
      expect(getSession).toHaveBeenCalled();
    });
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
    
    // Wait for user to be set
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toContain('test-user-id');
    });
    
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
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
    
    // Wait for error to be set
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Session error');
    });
    
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });
  
  it('handles safety timeout correctly', async () => {
    // Make getSession never resolve to trigger timeout
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
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });
  
  it('updates state on auth state changes', async () => {
    // Set up auth state change callback capture
    let authStateCallback: (event: string, session: any) => void;
    (onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
        error: null
      };
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial setup
    await waitFor(() => {
      expect(onAuthStateChange).toHaveBeenCalled();
    });
    
    // Simulate auth state change
    const newUser = { id: 'new-user-id', email: 'new@example.com' };
    act(() => {
      authStateCallback('SIGNED_IN', { user: newUser });
    });
    
    // Check the updated state
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toContain('new-user-id');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(createOrUpdateProfile).toHaveBeenCalledWith(newUser);
  });
  
  it('cleans up subscription on unmount', async () => {
    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for subscription to be set up
    await waitFor(() => {
      expect(onAuthStateChange).toHaveBeenCalled();
    });
    
    // Unmount the component
    unmount();
    
    // Verify unsubscribe was called
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
  
  it('handles errors during profile creation', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    (getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null
    });
    
    const profileError = new Error('Profile creation failed');
    (createOrUpdateProfile as jest.Mock).mockResolvedValue({
      data: null,
      error: profileError,
      success: false
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for user to be set
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toContain('test-user-id');
    });
    
    // User should still be authenticated despite profile error
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(createOrUpdateProfile).toHaveBeenCalledWith(mockUser);
    
    // Error should be logged but not affect authentication state
    // In a real implementation, you might want to handle this differently
    expect(screen.getByTestId('error').textContent).toBe('no-error');
  });
});
