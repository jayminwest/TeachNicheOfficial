import { render, screen } from '@testing-library/react';
import { Features } from './features';

describe('Features Component', () => {
  it('renders the component with title', () => {
    render(<Features />);
    
    // Check if the main title is rendered
    expect(screen.getByText('Why Choose Teach Niche?')).toBeInTheDocument();
  });

  it('renders all feature items', () => {
    render(<Features />);
    
    // Check if all feature titles are rendered
    expect(screen.getByText('Expert Tutorials')).toBeInTheDocument();
    expect(screen.getByText('Monetize Your Skills')).toBeInTheDocument();
    expect(screen.getByText('Community Support')).toBeInTheDocument();
    expect(screen.getByText('Integrity and Fairness')).toBeInTheDocument();
    expect(screen.getByText('Sustainable Growth')).toBeInTheDocument();
    expect(screen.getByText('Growth and Learning')).toBeInTheDocument();
    
    // Check if all feature descriptions are rendered
    expect(screen.getByText('Access comprehensive tutorials from top kendama players and learn at your own pace')).toBeInTheDocument();
    expect(screen.getByText('Create and sell your own kendama lessons while setting your own prices')).toBeInTheDocument();
    expect(screen.getByText('Join a thriving community of kendama enthusiasts - collaborate and grow together')).toBeInTheDocument();
    expect(screen.getByText('Community-first platform ensuring creators are rewarded fairly')).toBeInTheDocument();
    expect(screen.getByText('Building a long-term ecosystem for kendama education and innovation')).toBeInTheDocument();
    expect(screen.getByText('Resources for skill development and tools to support your favorite players')).toBeInTheDocument();
  });

  it('renders all feature icons', () => {
    render(<Features />);
    
    // The test should find 6 icons (one for each feature)
    const icons = document.querySelectorAll('.text-primary');
    expect(icons.length).toBe(6);
  });

  it('renders with the correct layout classes', () => {
    render(<Features />);
    
    // Check if the container has the correct background class
    const container = screen.getByText('Why Choose Teach Niche?').parentElement;
    expect(container).toHaveClass('bg-muted/50');
    
    // Check if the grid has the correct responsive classes
    const grid = screen.getByText('Expert Tutorials').parentElement?.parentElement;
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });
});
