import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock the components used in the page
jest.mock('@/app/components/ui/animated-hero', () => ({
  Hero: () => <div data-testid="mock-hero">Hero Component</div>
}));

jest.mock('@/app/components/ui/features', () => ({
  Features: () => <div data-testid="mock-features">Features Component</div>
}));

jest.mock('@/app/components/ui/email-signup', () => ({
  EmailSignup: () => <div data-testid="mock-email-signup">Email Signup Component</div>
}));

describe('Home Page', () => {
  it('renders the hero section', () => {
    render(<Home />);
    expect(screen.getByTestId('hero-section-container')).toBeInTheDocument();
    expect(screen.getByTestId('mock-hero')).toBeInTheDocument();
  });

  it('renders the features section', () => {
    render(<Home />);
    expect(screen.getByTestId('mock-features')).toBeInTheDocument();
  });

  it('renders the email signup section', () => {
    render(<Home />);
    expect(screen.getByTestId('mock-email-signup')).toBeInTheDocument();
  });

  it('includes the client-side script for auth dialog', () => {
    render(<Home />);
    const scripts = document.querySelectorAll('script');
    let hasAuthScript = false;
    
    // Convert scripts to an array and check if any contain the auth dialog code
    Array.from(scripts).forEach(script => {
      if (script.innerHTML.includes('home-client.js')) {
        hasAuthScript = true;
      }
    });
    
    expect(hasAuthScript).toBe(true);
  });
});
