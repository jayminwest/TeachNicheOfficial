import { render, screen } from '@testing-library/react';
import { Footer } from '@/app/components/ui/footer';

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

// Mock Instagram icon
jest.mock('lucide-react', () => ({
  Instagram: () => <div data-testid="instagram-icon" />
}));

describe('Footer Component', () => {
  const defaultProps = {
    logo: <div data-testid="logo">Logo</div>,
    brandName: 'Test Brand',
    socialLinks: [
      {
        icon: <div data-testid="instagram-icon" />,
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
    
    // Find all links with Instagram text
    const instagramLinks = screen.getAllByText('Instagram');
    // The first one should be the social link in the footer
    const instagramLink = instagramLinks[0];
    expect(instagramLink).toBeInTheDocument();
    
    // Find the external Instagram link
    const externalInstagramLink = screen.getByText((content, element) => {
      return content === 'Instagram' && 
        element?.getAttribute('href') === 'https://www.instagram.com/teachniche/?hl=en';
    });
    expect(externalInstagramLink).toBeInTheDocument();
    expect(externalInstagramLink).toHaveAttribute('target', '_blank');
    expect(externalInstagramLink).toHaveAttribute('rel', 'noopener noreferrer');
    
    const githubLink = screen.getByText('Github');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/jayminwest/Teach-Niche');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
