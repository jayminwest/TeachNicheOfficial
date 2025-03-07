import { render, screen } from '@testing-library/react';
import { Footer } from '@/app/components/ui/footer';
import { Instagram } from 'lucide-react';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...rest }: any) => {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

describe('Footer Component', () => {
  const defaultProps = {
    logo: <div data-testid="logo">Logo</div>,
    brandName: 'Test Brand',
    socialLinks: [
      {
        icon: <Instagram data-testid="instagram-icon" />,
        href: 'https://instagram.com/test',
        label: 'Instagram'
      }
    ],
    mainLinks: [
      {
        href: '/about',
        label: 'About'
      }
    ],
    legalLinks: [
      {
        href: '/legal#terms',
        label: 'Terms of Service'
      },
      {
        href: '/legal#privacy',
        label: 'Privacy Policy'
      }
    ],
    copyright: {
      text: '© 2025 Test Brand',
      license: 'All rights reserved'
    }
  };

  it('renders the brand name and logo', () => {
    render(<Footer {...defaultProps} />);
    
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  it('renders social links correctly', () => {
    render(<Footer {...defaultProps} />);
    
    const socialLink = screen.getByLabelText('Instagram');
    expect(socialLink).toBeInTheDocument();
    expect(socialLink).toHaveAttribute('href', 'https://instagram.com/test');
    expect(socialLink).toHaveAttribute('target', '_blank');
    expect(screen.getByTestId('instagram-icon')).toBeInTheDocument();
  });

  it('renders legal links correctly', () => {
    render(<Footer {...defaultProps} />);
    
    const termsLink = screen.getByText('Terms of Service');
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/legal#terms');
    
    const privacyLink = screen.getByText('Privacy Policy');
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/legal#privacy');
  });

  it('renders copyright information', () => {
    render(<Footer {...defaultProps} />);
    
    expect(screen.getByText('© 2025 Test Brand')).toBeInTheDocument();
    expect(screen.getByText('All rights reserved')).toBeInTheDocument();
    expect(screen.getByText('Made with ❤️ for the kendama community')).toBeInTheDocument();
  });

  it('renders with default legal links when not provided', () => {
    const propsWithoutLegalLinks = {
      ...defaultProps,
      legalLinks: undefined
    };
    
    render(<Footer {...propsWithoutLegalLinks} />);
    
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Legal Information')).toBeInTheDocument();
  });

  it('renders external links correctly', () => {
    render(<Footer {...defaultProps} />);
    
    const instagramLink = screen.getByText('Instagram');
    expect(instagramLink).toBeInTheDocument();
    expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/teachniche/?hl=en');
    expect(instagramLink).toHaveAttribute('target', '_blank');
    expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');
    
    const githubLink = screen.getByText('Github');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/jayminwest/Teach-Niche');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
