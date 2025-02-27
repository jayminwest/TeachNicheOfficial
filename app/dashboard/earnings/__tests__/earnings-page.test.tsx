import { render, screen } from '@testing-library/react';
import EarningsPage from '../page';
import userEvent from '@testing-library/user-event';

// Mock the components used in the page
jest.mock('@/app/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tabs-content-${value}`}>{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-${value}`} onClick={() => {}}>{children}</button>
  ),
}));

jest.mock('@/app/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('@/app/components/ui/bank-account-form', () => ({
  BankAccountForm: () => <div data-testid="bank-account-form">Bank Account Form</div>,
}));

jest.mock('../../components/earnings-history', () => ({
  __esModule: true,
  default: () => <div data-testid="earnings-history">Earnings History Component</div>,
}));

jest.mock('../../components/payout-history', () => ({
  __esModule: true,
  default: () => <div data-testid="payout-history">Payout History Component</div>,
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('EarningsPage', () => {
  it('renders the earnings page with correct title and description', () => {
    render(<EarningsPage />);
    
    expect(screen.getByText('Earnings & Payouts')).toBeInTheDocument();
    expect(screen.getByText('Track your revenue, payment history, and upcoming payouts')).toBeInTheDocument();
  });
  
  it('renders the back to dashboard link', () => {
    render(<EarningsPage />);
    
    const backLink = screen.getByTestId('back-to-dashboard');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/dashboard');
  });
  
  it('renders tabs for earnings and payouts', () => {
    render(<EarningsPage />);
    
    expect(screen.getByTestId('tab-earnings')).toBeInTheDocument();
    expect(screen.getByTestId('tab-payouts')).toBeInTheDocument();
  });
  
  it('renders the earnings summary section', () => {
    render(<EarningsPage />);
    
    expect(screen.getByTestId('earnings-summary')).toBeInTheDocument();
    expect(screen.getByTestId('total-earnings')).toBeInTheDocument();
    expect(screen.getByText('85% Revenue Share')).toBeInTheDocument();
  });
  
  it('renders the bank account form', () => {
    render(<EarningsPage />);
    
    expect(screen.getByTestId('bank-account-form')).toBeInTheDocument();
  });
  
  it('renders the payout information section', () => {
    render(<EarningsPage />);
    
    expect(screen.getByText('Payout Information')).toBeInTheDocument();
    expect(screen.getByText('Revenue Share')).toBeInTheDocument();
    expect(screen.getByText(/You receive 85% of the lesson price/)).toBeInTheDocument();
  });
  
  it('renders the learn more link', () => {
    render(<EarningsPage />);
    
    const learnMoreLink = screen.getByText('Learn more');
    expect(learnMoreLink).toBeInTheDocument();
    expect(learnMoreLink).toHaveAttribute('href', '/help/creator-payouts');
  });
});
