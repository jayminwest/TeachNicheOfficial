import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple mocks
jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: null, loading: false }))
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => ({ get: jest.fn() }))
}));

jest.mock('next/link', () => 
  function Link({ href, children }) {
    return <a href={href}>{children}</a>;
  }
);

// Mock components with minimal implementation
jest.mock('@/app/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <div>Theme Toggle</div>
}));

jest.mock('@/app/components/ui/button', () => ({
  Button: ({ children }) => <button>{children}</button>
}));

jest.mock('@/app/components/ui/navigation-menu', () => ({
  NavigationMenu: ({ children }) => <div>{children}</div>,
  NavigationMenuList: ({ children }) => <div>{children}</div>,
  NavigationMenuItem: ({ children }) => <div>{children}</div>,
  NavigationMenuTrigger: ({ children }) => <button>{children}</button>,
  NavigationMenuContent: ({ children }) => <div>{children}</div>,
  NavigationMenuLink: ({ children }) => <div>{children}</div>
}));

jest.mock('@/app/components/ui/dialog', () => ({
  Dialog: ({ children }) => <div>{children}</div>,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogTrigger: ({ children }) => <div>{children}</div>
}));

jest.mock('@/app/components/ui/sign-out-button', () => ({
  SignOutButton: () => <button>Sign out</button>
}));

jest.mock('@/app/components/ui/auth-dialog', () => ({
  AuthDialog: () => <div>Auth Dialog</div>
}));

jest.mock('lucide-react', () => ({
  Menu: () => <div>Menu</div>,
  MoveRight: () => <div>→</div>,
  X: () => <div>X</div>
}));

// Import the component to test
import { Header } from '../header';

describe('Header component', () => {
  it('renders the header with brand name', () => {
    render(<Header />);
    expect(screen.getByText('Teach Niche')).toBeInTheDocument();
  });
});
