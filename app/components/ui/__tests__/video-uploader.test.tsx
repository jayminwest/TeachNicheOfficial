import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { VideoUploader } from '../video-uploader';
import MuxUploader from '@mux/mux-uploader-react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the MuxUploader component
vi.mock('@mux/mux-uploader-react', () => ({
  __esModule: true,
  default: vi.fn(({ children, onUploadStart, onProgress, onSuccess, onError }) => {
    return (
      <div data-testid="mux-uploader-mock">
        {children}
        <button 
          data-testid="trigger-upload-start" 
          onClick={() => onUploadStart({ detail: { file: mockFile } })}
        >
          Trigger Upload Start
        </button>
        <button 
          data-testid="trigger-progress" 
          onClick={() => onProgress(new CustomEvent('progress', { detail: 50 }))}
        >
          Trigger Progress
        </button>
        <button 
          data-testid="trigger-success" 
          onClick={() => onSuccess(new CustomEvent('success'))}
        >
          Trigger Success
        </button>
        <button 
          data-testid="trigger-error" 
          onClick={() => onError(new CustomEvent('error', { detail: new Error('Upload failed') }))}
        >
          Trigger Error
        </button>
      </div>
    );
  })
}));

// Mock fetch API
global.fetch = vi.fn();

// Create a mock file for testing
const mockFile = new File(['dummy content'], 'test-video.mp4', { type: 'video/mp4' });

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement for video element
const mockVideoElement = {
  preload: '',
  videoWidth: 1280,
  videoHeight: 720,
  src: '',
  onloadedmetadata: null,
  onerror: null,
};

document.createElement = vi.fn((tagName) => {
  if (tagName === 'video') {
    return mockVideoElement;
  }
  return document.createElement(tagName);
});

describe('VideoUploader', () => {
  const onUploadComplete = vi.fn();
  const onError = vi.fn();
  const onUploadStart = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful fetch for upload URL
    global.fetch.mockImplementation((url) => {
      if (url === '/api/mux/upload') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url: 'https://mock-upload-url.com', assetId: 'mock-asset-id' })
        });
      } else if (url.includes('/api/mux/asset-status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            status: 'ready', 
            playbackId: 'mock-playback-id' 
          })
        });
      }
      return Promise.reject(new Error('Unhandled fetch URL'));
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Component Rendering Tests
  describe('Rendering', () => {
    it('renders in initial idle state', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      // Initially should show loading state
      expect(screen.getByText('Loading upload URL...')).toBeInTheDocument();
      
      // After fetch completes, should show upload button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Should show accepted formats info
      expect(screen.getByText(/Accepted formats/i)).toBeInTheDocument();
    });

    it('displays progress indicator during upload', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Trigger progress update
      fireEvent.click(screen.getByTestId('trigger-progress'));
      
      // Should show progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/Uploading... 50%/i)).toBeInTheDocument();
    });

    it('shows success state after upload completes', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Trigger success
      fireEvent.click(screen.getByTestId('trigger-success'));
      
      await waitFor(() => {
        expect(screen.getByText(/Upload complete!/i)).toBeInTheDocument();
      });
      
      // Should call onUploadComplete with the asset ID
      expect(onUploadComplete).toHaveBeenCalledWith('mock-asset-id');
    });

    it('displays error message when upload fails', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Trigger error
      fireEvent.click(screen.getByTestId('trigger-error'));
      
      // Should show error message
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
      
      // Should call onError with the error
      expect(onError).toHaveBeenCalled();
    });
  });

  // Upload Functionality Tests
  describe('Upload Functionality', () => {
    it('calls onUploadStart when upload begins', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
          onUploadStart={onUploadStart}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Should call onUploadStart
      expect(onUploadStart).toHaveBeenCalled();
    });

    it('shows processing state after upload completes', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Trigger success
      fireEvent.click(screen.getByTestId('trigger-success'));
      
      // Should show processing state before completing
      expect(screen.getByText(/Processing video/i)).toBeInTheDocument();
    });
  });

  // API Integration Tests
  describe('API Integration', () => {
    it('fetches upload URL on mount', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/mux/upload', expect.any(Object));
      });
    });

    it('checks asset status after upload completes', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Trigger success
      fireEvent.click(screen.getByTestId('trigger-success'));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/mux/asset-status?assetId=mock-asset-id'),
          undefined
        );
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('handles API errors when fetching upload URL', async () => {
      // Mock API error
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Server error')
        })
      );
      
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('handles asset status API errors', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Mock asset status API error
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Server error')
        })
      );
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Trigger success
      fireEvent.click(screen.getByTestId('trigger-success'));
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  // File Validation Tests
  describe('File Validation', () => {
    it('validates file size', async () => {
      // Create a mock file that exceeds the size limit
      const largeMockFile = new File(['x'.repeat(3000 * 1024 * 1024)], 'large-video.mp4', { type: 'video/mp4' });
      
      // Update the mock to use the large file
      vi.mocked(MuxUploader).mockImplementationOnce(({ children, onUploadStart, onProgress, onSuccess, onError }) => {
        return (
          <div data-testid="mux-uploader-mock">
            {children}
            <button 
              data-testid="trigger-upload-start" 
              onClick={() => onUploadStart({ detail: { file: largeMockFile } })}
            >
              Trigger Upload Start
            </button>
          </div>
        );
      });
      
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
          maxSizeMB={2000}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start with large file
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Should show error about file size
      await waitFor(() => {
        expect(screen.getByText(/File size must be less than/i)).toBeInTheDocument();
      });
      
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('File size must be less than')
      }));
    });

    it('validates file type', async () => {
      // Create a mock file with invalid type
      const invalidTypeFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
      
      // Update the mock to use the invalid file
      vi.mocked(MuxUploader).mockImplementationOnce(({ children, onUploadStart, onProgress, onSuccess, onError }) => {
        return (
          <div data-testid="mux-uploader-mock">
            {children}
            <button 
              data-testid="trigger-upload-start" 
              onClick={() => onUploadStart({ detail: { file: invalidTypeFile } })}
            >
              Trigger Upload Start
            </button>
          </div>
        );
      });
      
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start with invalid file type
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Should show error about file type
      await waitFor(() => {
        expect(screen.getByText(/File type must be one of/i)).toBeInTheDocument();
      });
      
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('File type must be one of')
      }));
    });

    it('validates video resolution', async () => {
      // Mock a video with resolution exceeding the limit
      mockVideoElement.videoWidth = 3840;
      mockVideoElement.videoHeight = 2160;
      
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
          maxResolution={{ width: 1920, height: 1080 }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Simulate onloadedmetadata event
      act(() => {
        mockVideoElement.onloadedmetadata();
      });
      
      // Should show error about resolution
      await waitFor(() => {
        expect(screen.getByText(/Video resolution must not exceed/i)).toBeInTheDocument();
      });
      
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Video resolution must not exceed')
      }));
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('handles retry logic for API failures', async () => {
      // Mock first API call to fail, second to succeed
      global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url: 'https://mock-upload-url.com', assetId: 'mock-asset-id' })
        }));
      
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      // Should eventually succeed after retry
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Should have called fetch twice
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('handles case when no file is selected', async () => {
      // Update the mock to trigger upload start with no file
      vi.mocked(MuxUploader).mockImplementationOnce(({ children, onUploadStart }) => {
        return (
          <div data-testid="mux-uploader-mock">
            {children}
            <button 
              data-testid="trigger-upload-start-no-file" 
              onClick={() => onUploadStart({ detail: { file: null } })}
            >
              Trigger Upload Start No File
            </button>
          </div>
        );
      });
      
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('mux-uploader-mock')).toBeInTheDocument();
      });
      
      // Trigger upload start with no file
      fireEvent.click(screen.getByTestId('trigger-upload-start-no-file'));
      
      // Should call onError with appropriate message
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No file selected'
      }));
    });

    it('handles case when asset processing fails', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Mock asset status to return errored state
      global.fetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'errored' })
      }));
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Trigger success
      fireEvent.click(screen.getByTestId('trigger-success'));
      
      // Should call onError with appropriate message
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Video processing failed'
        }));
      });
    });

    it('handles case when playback ID is missing', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Mock asset status to return ready state but no playback ID
      global.fetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ready', playbackId: null })
      }));
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Trigger success
      fireEvent.click(screen.getByTestId('trigger-success'));
      
      // Should call onError with appropriate message
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({
          message: 'No playback ID available'
        }));
      });
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('provides appropriate aria attributes for progress indicator', async () => {
      render(
        <VideoUploader
          onUploadComplete={onUploadComplete}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Video/i })).toBeInTheDocument();
      });
      
      // Trigger upload start
      fireEvent.click(screen.getByTestId('trigger-upload-start'));
      
      // Trigger progress update
      fireEvent.click(screen.getByTestId('trigger-progress'));
      
      // Progress bar should have appropriate role and aria attributes
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });
  });
});
