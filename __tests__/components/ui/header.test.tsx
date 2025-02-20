import { render, screen } from '@testing-library/react'
import { Header } from '@/components/ui/header'
import '@testing-library/jest-dom'
import { useAuth } from '@/auth/AuthContext'
import { usePathname } from 'next/navigation'

// Mock the dependencies
jest.mock('@/auth/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null
  }))
}))

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  Link: ({ children }: { children: React.ReactNode }) => children
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

describe('Header', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Header />)
      expect(screen.getByText('Teach Niche')).toBeInTheDocument()
    })
  })
})
