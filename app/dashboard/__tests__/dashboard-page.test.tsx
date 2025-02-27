import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';

// Mock the components used in the page
jest.mock('../components/dashboard-header', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-header">Dashboard Header</div>,
}));

jest.mock('../components/activity-feed', () => ({
  __esModule: true,
  default: () => <div data-testid="activity-feed">Activity Feed</div>,
}));

jest.mock('../components/performance-metrics', () => ({
  __esModule: true,
  default: () => <div data-testid="performance-metrics">Performance Metrics</div>,
}));

jest.mock('../components/lessons-grid', () => ({
  __esModule: true,
  default: () => <div data-testid="lessons-grid">Lessons Grid</div>,
}));

jest.mock('../components/analytics-section', () => ({
  __esModule: true,
  default: () => <div data-testid="analytics-section">Analytics Section</div>,
}));

jest.mock('../components/earnings-widget', () => ({
  __esModule: true,
  default: () => <div data-testid="earnings-widget">Earnings Widget</div>,
}));

jest.mock('../../components/ui/earnings-link', () => ({
  EarningsLink: ({ variant, ...props }: { variant?: string; [key: string]: unknown }) => (
    <a href="/dashboard/earnings" data-testid={props['data-testid'] || 'earnings-link'} data-variant={variant}>
      {variant === 'minimal' ? 'Earnings' : 'View detailed earnings & payouts'}
    </a>
  ),
}));

describe('DashboardPage', () => {
  it('renders the dashboard page with all components', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('lessons-grid')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-section')).toBeInTheDocument();
  });
  
  it('renders the earnings widget and link', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('earnings-widget')).toBeInTheDocument();
    
    const earningsLink = screen.getByTestId('earnings-dashboard-link');
    expect(earningsLink).toBeInTheDocument();
    expect(earningsLink).toHaveAttribute('href', '/dashboard/earnings');
    expect(earningsLink).toHaveAttribute('data-variant', 'dashboard');
  });
});
