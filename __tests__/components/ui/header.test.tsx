import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '@/components/ui/header'
import '@testing-library/jest-dom'
import { useAuth } from '@/auth/AuthContext'

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Menu: () => <div>Menu Icon</div>,
  MoveRight: () => <div>Move Right Icon</div>,
  X: () => <div>X Icon</div>
}))

// Mock the dependencies
jest.mock('@/auth/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    loading: false
  }))
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }))
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

// Navigation items for testing
const navigationItems = [
  {
    title: "Home",
    href: "/",
    description: "",
  },
  {
    title: "About",
    href: "/about",
    description: "",
  }
]

// Mock components
jest.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>
}))

jest.mock('@/components/ui/navigation-menu', () => ({
  NavigationMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavigationMenuList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavigationMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavigationMenuTrigger: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  NavigationMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="nav-content">{children}</div>,
  NavigationMenuLink: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  )
}))

jest.mock('@/components/ui/sign-in', () => ({
  SignInPage: () => <div>Sign In</div>
}))

jest.mock('@/components/ui/sign-up', () => ({
  SignUpPage: () => <div>Sign Up</div>
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn()
    }
  }
}))

describe('Header', () => {
  const mockScrollIntoView = jest.fn();
  
  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = mockScrollIntoView;
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Header />)
      expect(screen.getByText('Teach Niche')).toBeInTheDocument()
    })

    it('renders navigation items', () => {
      render(<Header />)
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
    })

    it('shows sign in and waitlist buttons when user is not authenticated', () => {
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: null,
        loading: false
      }))
      
      render(<Header />)
      // Get the first Sign In button (the one in the header)
      expect(screen.getAllByText('Sign In')[0]).toBeInTheDocument()
      expect(screen.getByText(/Join Teacher Waitlist/)).toBeInTheDocument()
    })

    it('shows profile and sign out buttons when user is authenticated', () => {
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: { id: '123', email: 'test@example.com' },
        loading: false
      }))
      
      render(<Header />)
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    it('renders theme toggle', () => {
      render(<Header />)
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })

    it('navigates to correct routes when navigation links are clicked', () => {
      render(<Header />)
      const homeLink = screen.getByText('Home')
      const aboutLink = screen.getByText('About')
      
      expect(homeLink.closest('a')).toHaveAttribute('href', '/')
      expect(aboutLink.closest('a')).toHaveAttribute('href', '/about')
    })

    it('handles authentication loading state appropriately', () => {
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: null,
        loading: true
      }))
      render(<Header />)
      
      // When loading, neither auth nor unauth buttons should be present
      const signInButtons = screen.queryAllByText('Sign In')
      expect(signInButtons.length).toBe(0)
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('toggles mobile menu when menu button is clicked', () => {
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: null,
        loading: false
      }))

      render(<Header />)
      const menuButton = screen.getByText('Menu Icon').parentElement
      const mobileMenu = screen.queryByTestId('mobile-menu')
      expect(mobileMenu).not.toBeInTheDocument()
      
      fireEvent.click(menuButton!)
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
      
      const closeButton = screen.getByText('X Icon').parentElement
      fireEvent.click(closeButton!)
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
    })

    it('handles sign out click', async () => {
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: { id: '123', email: 'test@example.com' },
        loading: false
      }))
      
      const { supabase } = require('@/lib/supabase')
      render(<Header />)
      
      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)
      
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('scrolls to email signup when waitlist button is clicked on home page', () => {
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: null,
        loading: false
      }))

      // Mock querySelector
      const mockElement = { scrollIntoView: mockScrollIntoView }
      document.querySelector = jest.fn().mockReturnValue(mockElement)

      render(<Header />)
      const waitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i })
      
      fireEvent.click(waitlistButton)
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    })

    it('redirects to home page email signup when waitlist button is clicked on other pages', () => {
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: null,
        loading: false
      }))

      const { usePathname } = require('next/navigation')
      ;(usePathname as jest.Mock).mockImplementation(() => '/about')
      
      render(<Header />)
      const waitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i })
      
      // Mock window.location
      const originalLocation = window.location
      delete window.location
      window.location = { ...originalLocation, href: '' as any }
      
      fireEvent.click(waitlistButton)
      expect(window.location.href).toBe('/#email-signup')
      
      // Restore original location
      window.location = originalLocation
    })

    it('expands navigation menu content when trigger is clicked', () => {
      render(<Header />)
      
      // Find and click a navigation menu trigger
      const trigger = screen.getByText('Home')
      fireEvent.click(trigger)

      // Verify the content is shown
      const content = screen.getByTestId('nav-content')
      expect(content).toBeInTheDocument()
    })

    it('closes navigation menu when clicking outside', () => {
      render(<Header />)
      
      // Open the menu
      const trigger = screen.getByText('Home')
      fireEvent.click(trigger)
      
      // Verify menu is open
      const content = screen.getByTestId('nav-content')
      expect(content).toBeInTheDocument()
      
      // Click outside
      fireEvent.click(document.body)
      
      // Verify menu is closed
      expect(screen.queryByTestId('nav-content')).not.toBeInTheDocument()
    })
  })
})
