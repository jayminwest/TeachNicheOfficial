import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from '../profile-form';
import { toast } from '@/app/components/ui/use-toast';

// Mock the toast function
jest.mock('@/app/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

describe('ProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all fields', () => {
    render(<ProfileForm />);
    
    // Check if all form elements are rendered
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
  });

  it('validates form inputs correctly', async () => {
    render(<ProfileForm />);
    
    // Submit the form without filling required fields
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('validates website URL format', async () => {
    render(<ProfileForm />);
    
    // Fill in name to pass that validation
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, 'Test User');
    
    // Enter invalid website URL
    const websiteInput = screen.getByLabelText(/website/i);
    await userEvent.type(websiteInput, 'invalid-url');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check for URL validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    });
  });

  it('accepts empty website field', async () => {
    render(<ProfileForm />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, 'Test User');
    
    const bioInput = screen.getByLabelText(/bio/i);
    await userEvent.type(bioInput, 'This is my bio');
    
    // Leave website empty
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Form should submit without website validation errors
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Profile updated"
      }));
    });
  });

  it('handles successful form submission', async () => {
    render(<ProfileForm />);
    
    // Fill in all fields with valid data
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, 'Test User');
    
    const bioInput = screen.getByLabelText(/bio/i);
    await userEvent.type(bioInput, 'This is my bio for testing purposes');
    
    const websiteInput = screen.getByLabelText(/website/i);
    await userEvent.type(websiteInput, 'https://example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check if success toast is shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      }));
    });
  });

  it('handles form submission errors', async () => {
    // Save the original console.error
    const originalConsoleError = console.error;
    
    try {
      // Mock console.error to throw an error during form submission
      console.error = jest.fn().mockImplementation(() => {
        throw new Error('Mocked error');
      });
      
      render(<ProfileForm />);
      
      // Fill in required fields
      const nameInput = screen.getByLabelText(/name/i);
      await userEvent.type(nameInput, 'Test User');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(submitButton);
      
      // Check if error toast is shown
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        }));
      });
    } finally {
      // Restore console.error - IMPORTANT: This ensures it's restored even if the test fails
      console.error = originalConsoleError;
    }
  });

  it('enforces maximum bio length', async () => {
    render(<ProfileForm />);
    
    // Fill in name to pass that validation
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, 'Test User');
    
    // Create a bio that exceeds the 500 character limit
    const longBio = 'a'.repeat(501);
    
    // Enter long bio
    const bioInput = screen.getByLabelText(/bio/i);
    await userEvent.type(bioInput, longBio);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check for bio length validation error
    await waitFor(() => {
      expect(screen.getByText(/bio must not be longer than 500 characters/i)).toBeInTheDocument();
    });
  });

  it('allows submission with minimum valid data', async () => {
    // Save the original console.error
    const originalConsoleError = console.error;
    
    try {
      // Just silence console.error without throwing
      console.error = jest.fn();
      
      render(<ProfileForm />);
      
      // Only fill in the required name field with minimum length
      const nameInput = screen.getByLabelText(/name/i);
      await userEvent.type(nameInput, 'Jo');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(submitButton);
      
      // Form should submit successfully
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({
          title: "Profile updated"
        }));
      });
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });
});
