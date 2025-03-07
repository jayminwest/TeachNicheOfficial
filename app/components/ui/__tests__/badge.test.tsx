import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from '@/app/components/ui/badge';
import { cn } from '@/app/lib/utils';

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Test Badge</Badge>);
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary');
    expect(badge).toHaveClass('text-primary-foreground');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-secondary');
    expect(badge).toHaveClass('text-secondary-foreground');
  });

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badge = screen.getByText('Destructive Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-destructive');
    expect(badge).toHaveClass('text-destructive-foreground');
  });

  it('renders with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badge = screen.getByText('Outline Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-foreground');
    expect(badge).not.toHaveClass('bg-primary');
  });

  it('renders with custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('custom-class');
    // Should still have default variant classes
    expect(badge).toHaveClass('bg-primary');
  });

  it('passes additional props to the div element', () => {
    render(<Badge data-testid="test-badge">Props Badge</Badge>);
    const badge = screen.getByTestId('test-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe('Props Badge');
  });

  it('combines variant classes correctly with cn utility', () => {
    // This test verifies the badgeVariants function works with the cn utility
    const className = cn(badgeVariants({ variant: 'secondary' }), 'extra-class');
    render(<Badge className={className}>Combined Classes</Badge>);
    const badge = screen.getByText('Combined Classes');
    expect(badge).toHaveClass('bg-secondary');
    expect(badge).toHaveClass('extra-class');
  });
});
