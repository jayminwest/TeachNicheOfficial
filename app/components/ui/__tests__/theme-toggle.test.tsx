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
    
    // Check that the sun icon is visible (scale-100) and moon is hidden (scale-0)
    const sunIcon = screen.getByTestId('sun-icon');
    const moonIcon = screen.getByTestId('moon-icon');
    
    expect(sunIcon).toHaveClass('scale-100');
    expect(moonIcon).toHaveClass('scale-0');
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
    
    // Check that the moon icon is visible (scale-100) and sun is hidden (scale-0)
    const sunIcon = screen.getByTestId('sun-icon');
    const moonIcon = screen.getByTestId('moon-icon');
    
    expect(sunIcon).toHaveClass('scale-0');
    expect(moonIcon).toHaveClass('scale-100');
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
