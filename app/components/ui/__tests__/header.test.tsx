import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../header';
import { useAuth } from '@/app/services/auth/AuthContext';
import { usePathname, useSearchParams } from 'next/navigation';

// Mock the hooks and components used in Header
jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams())
}));

// Mock the child components
jest.mock('../auth-dialog', () => ({
  AuthDialog: function MockAuthDialog({ open, onOpenChange, defaultView }) {
    return (
      <div data-testid="auth-dialog" data-open={open} data-view={defaultView}>
        <button onClick={() => onOpenChange(false)}>Close Dialog</button>
      </div>
    );
  }
}));

jest.mock('../theme-toggle', () => ({
  ThemeToggle: function MockThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>;
  }
}));

jest.mock('../sign-out-button', () => ({
  SignOutButton: function MockSignOutButton({ variant, className }) {
    return (
      <button data-testid="sign-out-button" data-variant={variant} className={className}>
        Sign Out
      </button>
    );
  }
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    
    // Default to unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });
  });

  it('renders the header with logo', () => {
    render(<Header />);
    expect(screen.getByText('Teach Niche')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
  });

  it('shows sign in button when user is not authenticated', () => {
    render(<Header />);
    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
  });

  it('shows profile and sign out buttons when user is authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      loading: false
    });

    render(<Header />);
    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
    expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
  });

  it('opens auth dialog when sign in button is clicked', () => {
    render(<Header />);
    fireEvent.click(screen.getByTestId('sign-in-button'));
    
    const dialog = screen.getByTestId('auth-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.getAttribute('data-open')).toBe('true');
    expect(dialog.getAttribute('data-view')).toBe('sign-in');
  });

  it('shows mobile menu when menu button is clicked', () => {
    render(<Header />);
    
    // Mobile menu should not be visible initially
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    
    // Click the menu button (the only button with Menu icon)
    const menuButton = screen.getAllByRole('button')[0];
    fireEvent.click(menuButton);
    
    // Mobile menu should now be visible
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
  });

  it('automatically opens auth dialog when auth=signin in URL', () => {
    const mockSearchParams = new URLSearchParams('?auth=signin');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    render(<Header />);
    
    const dialog = screen.getByTestId('auth-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.getAttribute('data-open')).toBe('true');
  });

  it('scrolls to email signup section when on home page', () => {
    // Create a mock element for the email signup section
    const mockElement = document.createElement('div');
    document.querySelector = jest.fn().mockImplementation(selector => {
      if (selector === '#email-signup') return mockElement;
      return null;
    });
    
    render(<Header />);
    
    // Find the "Join Teacher Waitlist" button (there are two, one for desktop and one for mobile)
    const waitlistButtons = screen.getAllByText(/Join Teacher Waitlist/);
    fireEvent.click(waitlistButtons[0]); // Click the desktop version
    
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('redirects to home page with hash when not on home page', () => {
    (usePathname as jest.Mock).mockReturnValue('/about');
    
    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: '' } as unknown as Location;
    
    render(<Header />);
    
    const waitlistButtons = screen.getAllByText(/Join Teacher Waitlist/);
    fireEvent.click(waitlistButtons[0]);
    
    expect(window.location.href).toBe('/#email-signup');
    
    // Restore original location
    window.location = originalLocation;
  });

  it('shows loading state correctly', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true
    });
    
    render(<Header />);
    
    // When loading, neither sign-in nor profile buttons should be visible
    expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-button')).not.toBeInTheDocument();
  });
});
