import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/ui/header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePathname } from 'next/navigation';

// Mock window.matchMedia for responsive design testing
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: jest.fn(() => <div data-testid="theme-toggle">Theme Toggle</div>),
}));

describe('Header', () => {
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    // Reset any mocks
    jest.clearAllMocks();
  });

  describe('desktop view', () => {
    it('renders the logo and brand name', () => {
      render(<Header />);
      const brandLink = screen.getByRole('link', { name: 'Teach Niche' });
      expect(brandLink).toBeInTheDocument();
    });

    it('renders desktop navigation menu with correct items', () => {
      render(<Header />);
      
      // Navigation buttons should be present in desktop view
      const homeButton = screen.getByRole('button', { name: 'Home' });
      const aboutButton = screen.getByRole('button', { name: 'About' });
      
      expect(homeButton).toBeInTheDocument();
      expect(aboutButton).toBeInTheDocument();
    });

    it('renders action buttons in desktop view', () => {
      render(<Header />);
      
      const themeToggle = screen.getByTestId('theme-toggle');
      const learnMoreButton = screen.getByRole('link', { name: 'Learn More' });
      const waitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i });
      
      expect(themeToggle).toBeInTheDocument();
      expect(learnMoreButton).toBeInTheDocument();
      expect(waitlistButton).toBeInTheDocument();
    });
  });

  describe('mobile view', () => {
    it('renders mobile menu button and toggles menu', () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();
      
      // Click to open menu
      fireEvent.click(menuButton);
      
      // Mobile menu items should now be visible
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      
      // Close button should replace menu button
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      
      // Click to close menu
      fireEvent.click(closeButton);
      
      // Menu items should be hidden
      expect(screen.queryByText('Home')).not.toBeVisible();
    });
  });

  describe('waitlist button behavior', () => {
    it('scrolls to email signup section when on home page', () => {
      const scrollIntoViewMock = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
      
      render(<Header />);
      const waitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i });
      
      fireEvent.click(waitlistButton);
      
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('navigates to home page email signup when on different page', () => {
      mockUsePathname.mockReturnValue('/about');
      
      render(<Header />);
      const waitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i });
      
      fireEvent.click(waitlistButton);
      
      expect(window.location.href).toBe('/#email-signup');
    });
  });
});
