import { render, screen } from '@testing-library/react';
import { Alert } from '@/app/components/ui/alert';

describe('Alert Component', () => {
  it('renders with default variant', () => {
    render(<Alert>Test Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('bg-background');
  });

  it('renders with destructive variant', () => {
    render(<Alert variant="destructive">Destructive Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('border-destructive/50');
    expect(alert).toHaveClass('text-destructive');
  });

  it('renders with custom className', () => {
    render(<Alert className="custom-class">Custom Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('custom-class');
  });

  it('renders children correctly', () => {
    render(
      <Alert>
        <h4>Alert Title</h4>
        <p>Alert description</p>
      </Alert>
    );
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert description')).toBeInTheDocument();
  });

  it('forwards additional props to the div element', () => {
    render(<Alert data-testid="test-alert">Test Alert</Alert>);
    const alert = screen.getByTestId('test-alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('role', 'alert');
  });
});
