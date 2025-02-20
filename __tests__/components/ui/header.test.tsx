import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/ui/header'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}))

// Mock components
jest.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <button aria-label="toggle theme">Toggle Theme</button>
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('Header', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/')
  })

  describe('rendering', () => {
    it('renders the logo', () => {
      render(<Header />)
      expect(screen.getByText('Teach Niche')).toBeInTheDocument()
    })

    it('renders navigation items', () => {
      render(<Header />)
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
    })

    it('renders theme toggle', () => {
      render(<Header />)
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })

    it('renders call-to-action buttons', () => {
      render(<Header />)
      expect(screen.getByText('Learn More')).toBeInTheDocument()
      expect(screen.getByText('Join Teacher Waitlist')).toBeInTheDocument()
    })
  })

  describe('mobile menu', () => {
    it('shows mobile menu when hamburger is clicked', async () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: '' }) // Hamburger button
      await userEvent.click(menuButton)
      
      // Check if mobile menu items are visible
      expect(screen.getAllByText('Learn More')[0]).toBeVisible()
      expect(screen.getAllByText('Join Teacher Waitlist')[0]).toBeVisible()
    })

    it('closes mobile menu when X button is clicked', async () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: '' })
      await userEvent.click(menuButton)
      
      const closeButton = screen.getByRole('button', { name: '' })
      await userEvent.click(closeButton)
      
      // Menu should be closed
      expect(screen.queryByRole('navigation')).not.toBeVisible()
    })
  })

  describe('navigation', () => {
    it('scrolls to email signup when on home page', async () => {
      // Mock scrollIntoView
      const mockScrollIntoView = jest.fn()
      window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
      
      (usePathname as jest.Mock).mockReturnValue('/')
      
      render(<Header />)
      const waitlistButton = screen.getByText('Join Teacher Waitlist')
      await userEvent.click(waitlistButton)
      
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    })

    it('redirects to home page email signup when on different page', async () => {
      // Mock window.location
      const mockAssign = jest.fn()
      Object.defineProperty(window, 'location', {
        value: { href: mockAssign },
        writable: true
      });
      
      (usePathname as jest.Mock).mockReturnValue('/about')
      
      render(<Header />)
      const waitlistButton = screen.getByText('Join Teacher Waitlist')
      await userEvent.click(waitlistButton)
      
      expect(window.location.href).toBe('/#email-signup')
    })
  })
})
