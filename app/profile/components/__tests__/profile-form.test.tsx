import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from '../profile-form';
import { toast } from '@/app/components/ui/use-toast';
import { useAuth } from '@/app/services/auth/AuthContext';

// Mock the toast function
jest.mock('@/app/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock the auth context
jest.mock('@/app/services/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: { id: '123' } }),
  })
) as jest.Mock;

describe('ProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default auth mock
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
        },
      },
    });
  });

  it('renders the form with all fields', async () => {
    render(<ProfileForm />);
    
    // Wait for form to load data
    await waitFor(() => {
      // Check if all form elements are rendered
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/social media/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
    });
  });

  it('validates form inputs correctly', async () => {
    render(<ProfileForm />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
    
    // Clear the name field
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    
    // Submit the form without filling required fields
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('accepts empty social media field', async () => {
    render(<ProfileForm />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
    
    // Fill in required fields
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Test User');
    
    const bioInput = screen.getByLabelText(/bio/i);
    await userEvent.clear(bioInput);
    await userEvent.type(bioInput, 'This is my bio');
    
    // Leave social media empty
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Form should submit without social media validation errors
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('handles successful form submission', async () => {
    render(<ProfileForm />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
    
    // Fill in all fields with valid data
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Test User');
    
    const bioInput = screen.getByLabelText(/bio/i);
    await userEvent.clear(bioInput);
    await userEvent.type(bioInput, 'This is my bio for testing purposes');
    
    const socialMediaInput = screen.getByLabelText(/social media/i);
    await userEvent.clear(socialMediaInput);
    await userEvent.type(socialMediaInput, '@testuser');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check if API was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/profile/update', expect.any(Object));
    });
    
    // Check if success toast is shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      }));
    });
  });

  it('handles form submission errors', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to update profile' }),
      })
    );
    
    render(<ProfileForm />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
    
    // Fill in required fields
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Test User');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check if error toast is shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error loading profile",
        description: "Failed to update profile",
        variant: "destructive"
      }));
    });
  });

  it('enforces maximum bio length', async () => {
    render(<ProfileForm />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
    
    // Fill in name to pass that validation
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Test User');
    
    // Create a bio that exceeds the 500 character limit
    const longBio = 'a'.repeat(501);
    
    // Enter long bio
    const bioInput = screen.getByLabelText(/bio/i);
    await userEvent.clear(bioInput);
    await userEvent.type(bioInput, longBio);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check for bio length validation error
    await waitFor(() => {
      expect(screen.getByText(/bio must not be longer than 500 characters/i)).toBeInTheDocument();
    });
  });

  it('enforces maximum social media tag length', async () => {
    render(<ProfileForm />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
    
    // Fill in name to pass that validation
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Test User');
    
    // Create a social media tag that exceeds the 100 character limit
    const longTag = '@' + 'a'.repeat(100);
    
    // Enter long social media tag
    const socialMediaInput = screen.getByLabelText(/social media/i);
    await userEvent.clear(socialMediaInput);
    await userEvent.type(socialMediaInput, longTag);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check for social media tag length validation error
    await waitFor(() => {
      expect(screen.getByText(/social media tag must not be longer than 100 characters/i)).toBeInTheDocument();
    });
  });

  it('allows submission with minimum valid data', async () => {
    render(<ProfileForm />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
    
    // Only fill in the required name field with minimum length
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Jo');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Form should submit successfully
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/profile/update', expect.any(Object));
    });
  });

  it('fetches profile data on load', async () => {
    // Mock fetch to return profile data
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            full_name: 'Existing User',
            bio: 'Existing bio',
            social_media_tag: '@existinguser'
          }
        }),
      })
    );
    
    render(<ProfileForm />);
    
    // Check if fetch was called to get profile data
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/profile/get'), expect.any(Object));
    });
    
    // Check if form was populated with fetched data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing bio')).toBeInTheDocument();
      expect(screen.getByDisplayValue('@existinguser')).toBeInTheDocument();
    });
  });

  it('handles error when fetching profile data', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch profile' }),
      })
    );
    
    render(<ProfileForm />);
    
    // Check if fetch was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/profile/get'), expect.any(Object));
    });
    
    // Check if error toast is shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error loading profile",
        description: "Failed to fetch profile",
        variant: "destructive"
      }));
    });
  });

  it('handles network error when fetching profile data', async () => {
    // Mock fetch to throw a network error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );
    
    render(<ProfileForm />);
    
    // Check if error toast is shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error loading profile",
        description: "Network error",
        variant: "destructive"
      }));
    });
  });

  it('creates profile from user metadata when no profile exists', async () => {
    // First fetch returns no data (profile doesn't exist)
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })
    );
    
    // Second fetch for profile creation
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { id: '123' } }),
      })
    );
    
    // Set up auth with user metadata
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Metadata Name',
          bio: 'Metadata bio',
          social_media_tag: '@metadatauser',
        },
      },
    });
    
    render(<ProfileForm />);
    
    // Check if profile creation API was called with metadata
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/profile/update', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Metadata Name'),
      }));
    });
    
    // Check if form was populated with metadata
    await waitFor(() => {
      expect(screen.getByDisplayValue('Metadata Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Metadata bio')).toBeInTheDocument();
      expect(screen.getByDisplayValue('@metadatauser')).toBeInTheDocument();
    });
  });

  it('refreshes profile data after successful update', async () => {
    // Initial profile fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            full_name: 'Initial Name',
            bio: 'Initial bio',
            social_media_tag: '@initial'
          }
        }),
      })
    );
    
    // Profile update
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { id: '123' } }),
      })
    );
    
    // Profile refresh after update
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            full_name: 'Updated Name',
            bio: 'Updated bio',
            social_media_tag: '@updated'
          }
        }),
      })
    );
    
    // Mock setTimeout to execute immediately
    jest.useFakeTimers();
    
    render(<ProfileForm />);
    
    // Wait for initial form load with shorter timeout
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Set form values directly instead of simulating typing
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    
    const bioInput = screen.getByLabelText(/bio/i);
    fireEvent.change(bioInput, { target: { value: 'Updated bio' } });
    
    const socialMediaInput = screen.getByLabelText(/social media/i);
    fireEvent.change(socialMediaInput, { target: { value: '@updated' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);
    
    // Check if update API was called with shorter timeout
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/profile/update', expect.any(Object));
    }, { timeout: 1000 });
    
    // Fast-forward timers to trigger the refresh
    act(() => {
      jest.runAllTimers();
    });
    
    // Check if refresh API was called with shorter timeout
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3);
    }, { timeout: 1000 });
    
    // Restore timers
    jest.useRealTimers();
  }, 15000); // Increase the test timeout to 15 seconds
});
