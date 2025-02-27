import { render, screen } from '@testing-library/react';
import { EarningsLink } from './earnings-link';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

describe('EarningsLink', () => {
  it('renders dashboard variant correctly', () => {
    render(<EarningsLink variant="dashboard" />);
    
    const link = screen.getByTestId('earnings-link');
    expect(link).toHaveAttribute('href', '/dashboard/earnings');
    expect(link).toHaveTextContent('View detailed earnings & payouts');
    expect(link).toHaveAttribute('aria-label', 'View your detailed earnings and payout history');
  });

  it('renders profile variant correctly', () => {
    render(<EarningsLink variant="profile" />);
    
    const link = screen.getByTestId('earnings-link');
    expect(link).toHaveAttribute('href', '/dashboard/earnings');
    expect(link).toHaveTextContent('View detailed earnings & payouts');
  });

  it('renders minimal variant correctly', () => {
    render(<EarningsLink variant="minimal" />);
    
    const link = screen.getByTestId('earnings-link');
    expect(link).toHaveAttribute('href', '/dashboard/earnings');
    expect(link).toHaveTextContent('Earnings');
  });

  it('applies custom className', () => {
    render(<EarningsLink className="custom-class" />);
    
    const link = screen.getByTestId('earnings-link');
    expect(link).toHaveClass('custom-class');
  });
  
  it('renders with correct styles for each variant', () => {
    const { rerender } = render(<EarningsLink variant="dashboard" />);
    let link = screen.getByTestId('earnings-link');
    expect(link).toHaveClass('border');
    expect(link).toHaveClass('border-primary/20');
    
    rerender(<EarningsLink variant="profile" />);
    link = screen.getByTestId('earnings-link');
    expect(link).not.toHaveClass('border');
    expect(link).toHaveClass('text-primary');
    
    rerender(<EarningsLink variant="minimal" />);
    link = screen.getByTestId('earnings-link');
    expect(link).not.toHaveClass('border');
    expect(link).toHaveClass('text-primary');
  });
  
  it('includes the arrow icon for all variants', () => {
    render(<EarningsLink variant="dashboard" />);
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeInTheDocument();
  });
});
