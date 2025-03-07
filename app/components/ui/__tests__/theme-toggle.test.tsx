import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/app/components/ui/theme-toggle';
import { useTheme } from 'next-themes';

// Mock the next-themes module
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

describe('ThemeToggle', () => {
  const mockSetTheme = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders with light theme active', () => {
    // Mock the useTheme hook to return light theme
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });
    
    render(<ThemeToggle />);
    
    // Check that the button is rendered
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    
    // Check that the sun icon is visible and moon icon exists
    const sunIcon = screen.getByTestId('sun-icon');
    const moonIcon = screen.getByTestId('moon-icon');
    
    expect(sunIcon).toBeInTheDocument();
    expect(moonIcon).toBeInTheDocument();
    
    // In light mode, sun icon should have the scale-100 class and moon should have scale-0
    expect(sunIcon.className).toContain('scale-100');
    expect(moonIcon.className).toContain('scale-0');
  });
  
  it('renders with dark theme active', () => {
    // Mock the useTheme hook to return dark theme
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });
    
    render(<ThemeToggle />);
    
    // Check that the button is rendered
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    
    // Check that both icons exist
    const sunIcon = screen.getByTestId('sun-icon');
    const moonIcon = screen.getByTestId('moon-icon');
    
    expect(sunIcon).toBeInTheDocument();
    expect(moonIcon).toBeInTheDocument();
    
    // In dark mode, moon icon should have the scale-100 class and sun should have scale-0
    expect(sunIcon.className).toContain('scale-0');
    expect(moonIcon.className).toContain('scale-100');
  });
  
  it('toggles theme when clicked', async () => {
    const user = userEvent.setup();
    
    // Mock the useTheme hook to return light theme
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });
    
    render(<ThemeToggle />);
    
    // Get the button and click it
    const button = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(button);
    
    // Check that setTheme was called with 'dark'
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
  
  it('toggles from dark to light theme when clicked', async () => {
    const user = userEvent.setup();
    
    // Mock the useTheme hook to return dark theme
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });
    
    render(<ThemeToggle />);
    
    // Get the button and click it
    const button = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(button);
    
    // Check that setTheme was called with 'light'
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
