import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the auth service before importing Header
jest.mock('@/app/services/auth/supabaseAuth', () => {
  return {
    signOut: jest.fn().mockResolvedValue({}),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ 
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  };
});

// Mock the dependencies
jest.mock('@/app/services/auth/AuthContext', () => {
  return {
    useAuth: jest.fn()
  };
});

// Mock Lucide icons
jest.mock('lucide-react', () => {
  return {
    Menu: () => <div>Menu Icon</div>,
    MoveRight: () => <div>Move Right Icon</div>,
    X: () => <div>X Icon</div>
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => {
  return {
    usePathname: jest.fn(() => '/'),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn()
    })),
    useSearchParams: jest.fn(() => ({
      get: jest.fn(() => null)
    }))
  };
});

// Mock next/link
jest.mock('next/link', () => {
  const Link = ({ children, href }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = 'Link';
  return {
    __esModule: true,
    default: Link
  };
});

// Mock components
jest.mock('@/app/components/ui/theme-toggle', () => {
  return {
    ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>
  };
});

jest.mock('@/app/components/ui/navigation-menu', () => {
  return {
    NavigationMenu: ({ children }) => <div>{children}</div>,
    NavigationMenuList: ({ children }) => <div>{children}</div>,
    NavigationMenuItem: ({ children }) => <div>{children}</div>,
    NavigationMenuTrigger: ({ children, onClick }) => (
      <button onClick={onClick}>{children}</button>
    ),
    NavigationMenuContent: ({ children }) => <div data-testid="nav-content">{children}</div>,
    NavigationMenuLink: ({ children }) => <div>{children}</div>
  };
});

jest.mock('@/app/components/ui/dialog', () => {
  return {
    Dialog: ({ children }) => <div>{children}</div>,
    DialogContent: ({ children }) => <div>{children}</div>,
    DialogTrigger: ({ children }) => <div>{children}</div>,
    DialogTitle: ({ children }) => <div>{children}</div>
  };
});

jest.mock('@/app/components/ui/button', () => {
  return {
    Button: ({ children, onClick }) => (
      <button onClick={onClick}>{children}</button>
    )
  };
});

jest.mock('@/app/components/ui/sign-in', () => {
  return {
    SignInPage: () => <div>Sign In</div>
  };
});

jest.mock('@/app/components/ui/auth-dialog', () => {
  return {
    AuthDialog: ({ defaultView }) => (
      <div data-testid="auth-dialog">Auth Dialog: {defaultView}</div>
    )
  };
});

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
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn()
    }));
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });
      render(<Header />);
      expect(screen.getByText('Teach Niche')).toBeInTheDocument();
    });

    it('renders navigation items', () => {
      (useAuth as jest.Mock).mockReturnValue({
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
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });
      
      render(<Header />);
      // Get the first Sign In button (the one in the header)
      expect(screen.getAllByText('Sign In')[0]).toBeInTheDocument();
      expect(screen.getByText(/Join Teacher Waitlist/)).toBeInTheDocument();
    });

    it('shows profile and sign out buttons when user is authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-id', email: 'test@example.com' },
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn()
      });
        
      render(<Header />);
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('renders theme toggle', () => {
      render(<Header />);
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('navigates to correct routes when navigation links are clicked', () => {
      render(<Header />);
      const homeLink = screen.getByText('Home');
      
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('handles authentication loading state appropriately', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });
      render(<Header />);
      
      // When loading, neither auth nor unauth buttons should be present
      const signInButtons = screen.queryAllByText('Sign In');
      expect(signInButtons.length).toBe(0);
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('toggles mobile menu when menu button is clicked', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      render(<Header />);
      const menuButton = screen.getByText('Menu Icon').parentElement;
      const mobileMenu = screen.queryByTestId('mobile-menu');
      expect(mobileMenu).not.toBeInTheDocument();
      
      fireEvent.click(menuButton!);
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      
      const closeButton = screen.getByText('X Icon').parentElement;
      fireEvent.click(closeButton!);
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    it('scrolls to email signup when waitlist button is clicked on home page', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      // Mock querySelector
      const mockElement = { scrollIntoView: mockScrollIntoView };
      document.querySelector = jest.fn().mockReturnValue(mockElement);

      render(<Header />);
      const waitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i });
      
      fireEvent.click(waitlistButton);
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('redirects to home page email signup when waitlist button is clicked on other pages', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      const { usePathname } = jest.requireMock('next/navigation');
      (usePathname as jest.Mock).mockImplementation(() => '/about');
      
      render(<Header />);
      const waitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i });
      
      // Mock window.location.href
      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: '' }
      });
      
      fireEvent.click(waitlistButton);
      expect(window.location.href).toBe('/#email-signup');
      
      // Clean up
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: originalHref }
      });
    });

    it('expands navigation menu content when trigger is clicked', () => {
      render(<Header />);
      
      // Find and click a navigation menu trigger
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);

      // Verify the link exists
      expect(homeButton.closest('a')).toHaveAttribute('href', '/');
    });

    it('handles navigation menu interactions', () => {
      render(<Header />);
      
      // Find and verify About link
      const aboutButton = screen.getByText('About');
      fireEvent.click(aboutButton);
      
      // Verify the link exists
      expect(aboutButton.closest('a')).toHaveAttribute('href', '/about');
    });

    it('closes mobile menu when a navigation link is clicked', () => {
      render(<Header />);
      
      // Open the mobile menu
      const menuButton = screen.getByText('Menu Icon').parentElement;
      fireEvent.click(menuButton!);
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      
      // Click a navigation link in the mobile menu
      const aboutLink = screen.getAllByText('About')[1]; // Get the one in the mobile menu
      fireEvent.click(aboutLink);
      
      // Verify the mobile menu is closed
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });
  });
});
