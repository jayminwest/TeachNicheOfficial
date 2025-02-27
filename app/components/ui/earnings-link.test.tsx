import { render, screen } from '@testing-library/react';
import { EarningsLink } from './earnings-link';

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
});
