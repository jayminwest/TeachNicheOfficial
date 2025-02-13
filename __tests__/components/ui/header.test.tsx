import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/components/ui/header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/components/ui/theme-toggle', () => {
  return {
    ThemeToggle: jest.fn(() => <div>Theme Toggle</div>),
  };
});

describe('Header', () => {
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the logo and navigation items correctly', () => {
      render(<Header />);

      expect(screen.getByText('Teach Niche')).toBeInTheDocument();

      const navigationMenu = screen.getByRole('navigation');
      expect(navigationMenu).toBeInTheDocument();
      
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toBeInTheDocument();
      
      const aboutLink = screen.getByRole('link', { name: 'About' });
      expect(aboutLink).toBeInTheDocument();
    });

    it('renders the mobile menu button and theme toggle correctly', () => {
      render(<Header />);

      const mobileMenuButton = screen.getByRole('button', { name: /menu|close/i });
      expect(mobileMenuButton).toBeInTheDocument();

      const themeToggle = screen.getByText('Theme Toggle');
      expect(themeToggle).toBeInTheDocument();
    });

    it('renders the desktop navigation and buttons correctly', () => {
      render(<Header />);

      const learnMoreLink = screen.getByRole('link', { name: 'Learn More' });
      expect(learnMoreLink).toBeInTheDocument();

      const joinWaitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i });
      expect(joinWaitlistButton).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('toggles the mobile menu on button click', () => {
      render(<Header />);

      const mobileMenuButton = screen.getByRole('button', { name: /menu|close/i });
      fireEvent.click(mobileMenuButton);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();

      fireEvent.click(mobileMenuButton);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('scrolls to the email signup section when on home page', () => {
      const scrollIntoViewMock = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
      
      render(<Header />);

      const joinWaitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i });
      fireEvent.click(joinWaitlistButton);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('navigates to the email signup section when on a different page', () => {
      mockUsePathname.mockReturnValue('/about');

      render(<Header />);

      const joinWaitlistButton = screen.getByRole('button', { name: /join teacher waitlist/i });
      fireEvent.click(joinWaitlistButton);

      expect(window.location.href).toBe('/#email-signup');
    });
  });

  describe('props', () => {
    it('renders the theme toggle and navigation items with auth context', () => {
      render(<Header />, { wrapper: ({ children }) => <>{children}</> });

      const themeToggle = screen.getByText('Theme Toggle');
      expect(themeToggle).toBeInTheDocument();

      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).toBeInTheDocument();
    });
  });
});
