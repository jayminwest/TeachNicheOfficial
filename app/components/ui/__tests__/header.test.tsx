import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@/app/services/auth/supabaseAuth', () => ({
  signOut: jest.fn().mockResolvedValue({}),
  getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  onAuthStateChange: jest.fn().mockReturnValue({ 
    data: { subscription: { unsubscribe: jest.fn() } }
  })
}));

jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('lucide-react', () => ({
  Menu: () => <div>Menu Icon</div>,
  MoveRight: () => <div>Move Right Icon</div>,
  X: () => <div>X Icon</div>
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null)
  }))
}));

jest.mock('next/link', () => {
  return function Link(props) {
    return <a href={props.href}>{props.children}</a>;
  };
});

jest.mock('@/app/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>
}));

jest.mock('@/app/components/ui/navigation-menu', () => ({
  NavigationMenu: ({ children }) => <div>{children}</div>,
  NavigationMenuList: ({ children }) => <div>{children}</div>,
  NavigationMenuItem: ({ children }) => <div>{children}</div>,
  NavigationMenuTrigger: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
  NavigationMenuContent: ({ children }) => <div data-testid="nav-content">{children}</div>,
  NavigationMenuLink: ({ children }) => <div>{children}</div>
}));

jest.mock('@/app/components/ui/dialog', () => ({
  Dialog: ({ children }) => <div>{children}</div>,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogTrigger: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>
}));

jest.mock('@/app/components/ui/button', () => ({
  Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  )
}));

jest.mock('@/app/components/ui/sign-in', () => ({
  SignInPage: () => <div>Sign In</div>
}));

jest.mock('@/app/components/ui/auth-dialog', () => ({
  AuthDialog: ({ defaultView }) => (
    <div data-testid="auth-dialog">Auth Dialog: {defaultView}</div>
  )
}));

// Import Header after mocks are set up
import { Header } from '../header';
import { useAuth } from '@/app/services/auth/AuthContext';

describe('Header', () => {
  const mockScrollIntoView = jest.fn();
  
  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = mockScrollIntoView;
    // Reset all mocks
    jest.clearAllMocks();
    // Reset useAuth mock before each test
    (useAuth).mockImplementation(() => ({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn()
    }));
  });

  it('renders without crashing', () => {
    (useAuth).mockReturnValue({
      user: null,
      loading: false
    });
    render(<Header />);
    expect(screen.getByText('Teach Niche')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    (useAuth).mockReturnValue({
      user: null,
      loading: false
    });
    render(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
  });

  it('shows sign in and waitlist buttons when user is not authenticated', () => {
    (useAuth).mockReturnValue({
      user: null,
      loading: false
    });
    
    render(<Header />);
    expect(screen.getAllByText('Sign In')[0]).toBeInTheDocument();
    expect(screen.getByText(/Join Teacher Waitlist/)).toBeInTheDocument();
  });

  it('shows profile and sign out buttons when user is authenticated', () => {
    (useAuth).mockReturnValue({
      user: { id: 'test-id', email: 'test@example.com' },
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn()
    });
      
    render(<Header />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('toggles mobile menu when menu button is clicked', () => {
    (useAuth).mockReturnValue({
      user: null,
      loading: false
    });

    render(<Header />);
    const menuButton = screen.getByText('Menu Icon').parentElement;
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    
    fireEvent.click(menuButton);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    
    const closeButton = screen.getByText('X Icon').parentElement;
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });
});
