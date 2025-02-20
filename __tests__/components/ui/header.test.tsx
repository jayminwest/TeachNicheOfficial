import { render, screen } from '@testing-library/react'
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

// Mock components
jest.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>
}))

jest.mock('@/components/ui/navigation-menu', () => ({
  NavigationMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavigationMenuList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavigationMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavigationMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavigationMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
  })
})
