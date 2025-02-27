import { render, screen } from '@testing-library/react';
import { EarningsLink } from '../earnings-link';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('EarningsLink Integration', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('integrates with dashboard layout', () => {
    render(
      <div className="dashboard-layout">
        <div className="sidebar">
          <nav>
            <ul>
              <li>
                <EarningsLink variant="minimal" />
              </li>
            </ul>
          </nav>
        </div>
        <div className="main-content">
          <div className="earnings-widget">
            <h3>Earnings Overview</h3>
            <p>$1,234.56</p>
            <EarningsLink variant="dashboard" />
          </div>
        </div>
      </div>
    );
    
    // Verify both links are rendered correctly
    const links = screen.getAllByTestId('earnings-link');
    expect(links).toHaveLength(2);
    
    // Minimal variant in sidebar
    expect(links[0]).toHaveTextContent('Earnings');
    
    // Dashboard variant in main content
    expect(links[1]).toHaveTextContent('View detailed earnings & payouts');
  });
  
  it('integrates with profile layout', () => {
    render(
      <div className="profile-layout">
        <div className="profile-header">
          <h1>User Profile</h1>
        </div>
        <div className="profile-content">
          <div className="profile-sidebar">
            <h3>Creator Tools</h3>
            <nav>
              <ul>
                <li>
                  <EarningsLink variant="profile" />
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    );
    
    const link = screen.getByTestId('earnings-link');
    expect(link).toHaveTextContent('View detailed earnings & payouts');
  });
});
