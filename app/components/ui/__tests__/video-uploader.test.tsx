import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoUploader } from '../video-uploader';
import '@testing-library/jest-dom';

// Mock MuxUploader component
jest.mock('@mux/mux-uploader-react', () => {
  return {
    __esModule: true,
    default: ({ children, onUploadStart, onProgress, onSuccess, onError }) => {
      return (
        <div data-testid="mux-uploader" onClick={() => {
          // Simulate file selection and upload start
          const mockFile = new File(['dummy content'], 'test-video.mp4', { type: 'video/mp4' });
          if (onUploadStart) {
            onUploadStart({ detail: { file: mockFile } });
          }
        }}>
          {children}
          <button 
            data-testid="simulate-progress" 
            onClick={() => onProgress && onProgress(new CustomEvent('progress', { detail: 50 }))}
          >
            Simulate Progress
          </button>
          <button 
            data-testid="simulate-success" 
            onClick={() => onSuccess && onSuccess(new CustomEvent('success'))}
          >
            Simulate Success
          </button>
          <button 
            data-testid="simulate-error" 
            onClick={() => onError && onError(new CustomEvent('error', { detail: new Error('Upload failed') }))}
          >
            Simulate Error
          </button>
        </div>
      );
    }
  };
});

// Mock the fetch API
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock HTMLVideoElement
Object.defineProperty(global.HTMLVideoElement.prototype, 'videoWidth', { value: 1280 });
Object.defineProperty(global.HTMLVideoElement.prototype, 'videoHeight', { value: 720 });

// Helper to setup successful fetch responses
const setupSuccessfulFetches = () => {
  // Mock the initial upload URL fetch
  mockFetch.mockImplementationOnce(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ url: 'https://mock-upload-url.com', assetId: 'mock-asset-id' })
    })
  );
  
  // Mock the asset status fetch
  mockFetch.mockImplementationOnce(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ 
        status: 'ready', 
        playbackId: 'mock-playback-id' 
      })
    })
  );
};

describe('VideoUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSuccessfulFetches();
  });

  it('renders the uploader in idle state', async () => {
    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={jest.fn()} 
      />
    );

    // Wait for the upload URL to be fetched
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/mux/upload', { method: 'POST' });
    });

    // Check that the uploader is rendered with the upload button
    expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    expect(screen.getByText(/accepted formats/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching upload URL', async () => {
    // Make fetch delay to show loading state
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://mock-upload-url.com', assetId: 'mock-asset-id' })
      }), 100))
    );

    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={jest.fn()} 
      />
    );

    expect(screen.getByText('Loading upload URL...')).toBeInTheDocument();
    
    // Wait for the upload URL to be fetched
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    });
  });

  it('handles upload start correctly', async () => {
    const onUploadStartMock = jest.fn();
    
    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={jest.fn()}
        onUploadStart={onUploadStartMock}
      />
    );

    // Wait for the upload URL to be fetched
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    });

    // Click the upload button to start the upload
    fireEvent.click(screen.getByRole('button', { name: /upload video/i }));

    // Check that onUploadStart was called
    expect(onUploadStartMock).toHaveBeenCalled();
    
    // Check that the status changed to uploading
    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
  });

  it('shows upload progress', async () => {
    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={jest.fn()}
      />
    );

    // Wait for the upload URL to be fetched
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    });

    // Click the upload button to start the upload
    fireEvent.click(screen.getByRole('button', { name: /upload video/i }));
    
    // Simulate progress event
    fireEvent.click(screen.getByTestId('simulate-progress'));
    
    // Check that the progress is shown
    expect(screen.getByText(/uploading.*50%/i)).toBeInTheDocument();
  });

  it('handles successful upload completion', async () => {
    const onUploadCompleteMock = jest.fn();
    
    render(
      <VideoUploader 
        onUploadComplete={onUploadCompleteMock} 
        onError={jest.fn()}
      />
    );

    // Wait for the upload URL to be fetched
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    });

    // Click the upload button to start the upload
    fireEvent.click(screen.getByRole('button', { name: /upload video/i }));
    
    // Simulate success event
    fireEvent.click(screen.getByTestId('simulate-success'));
    
    // Check that processing state is shown
    expect(screen.getByText(/processing video/i)).toBeInTheDocument();
    
    // Wait for the asset status to be fetched
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/mux/asset-status?assetId=mock-asset-id');
    });
    
    // Check that the upload complete message is shown
    expect(screen.getByText(/upload complete/i)).toBeInTheDocument();
    
    // Check that onUploadComplete was called with the asset ID
    expect(onUploadCompleteMock).toHaveBeenCalledWith('mock-asset-id');
  });

  it('handles upload errors', async () => {
    const onErrorMock = jest.fn();
    
    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={onErrorMock}
      />
    );

    // Wait for the upload URL to be fetched
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    });

    // Click the upload button to start the upload
    fireEvent.click(screen.getByRole('button', { name: /upload video/i }));
    
    // Simulate error event
    fireEvent.click(screen.getByTestId('simulate-error'));
    
    // Check that the error message is shown
    expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    
    // Check that onError was called with the error
    expect(onErrorMock).toHaveBeenCalled();
    expect(onErrorMock.mock.calls[0][0].message).toBe('Upload failed');
  });

  it('handles API error when fetching upload URL', async () => {
    const onErrorMock = jest.fn();
    
    // Mock fetch to return an error
    mockFetch.mockReset();
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error')
      })
    );
    
    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={onErrorMock}
      />
    );

    // Wait for the error to be handled
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock.mock.calls[0][0].message).toContain('Failed to get upload URL');
    });
  });

  it('handles API error when checking asset status', async () => {
    const onErrorMock = jest.fn();
    
    // Mock the initial upload URL fetch
    mockFetch.mockReset();
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://mock-upload-url.com', assetId: 'mock-asset-id' })
      })
    );
    
    // Mock the asset status fetch to return an error
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error')
      })
    );
    
    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={onErrorMock}
      />
    );

    // Wait for the upload URL to be fetched
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    });

    // Click the upload button to start the upload
    fireEvent.click(screen.getByRole('button', { name: /upload video/i }));
    
    // Simulate success event
    fireEvent.click(screen.getByTestId('simulate-success'));
    
    // Wait for the asset status to be fetched and error to be handled
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock.mock.calls[0][0].message).toBe('Failed to get asset status');
    });
  });

  it('handles asset processing error', async () => {
    const onErrorMock = jest.fn();
    
    // Mock the initial upload URL fetch
    mockFetch.mockReset();
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://mock-upload-url.com', assetId: 'mock-asset-id' })
      })
    );
    
    // Mock the asset status fetch to return an error status
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'errored', 
          playbackId: null 
        })
      })
    );
    
    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={onErrorMock}
      />
    );

    // Wait for the upload URL to be fetched
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    });

    // Click the upload button to start the upload
    fireEvent.click(screen.getByRole('button', { name: /upload video/i }));
    
    // Simulate success event
    fireEvent.click(screen.getByTestId('simulate-success'));
    
    // Wait for the asset status to be fetched and error to be handled
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock.mock.calls[0][0].message).toBe('Video processing failed');
    });
  });

  it('handles missing playback ID error', async () => {
    const onErrorMock = jest.fn();
    
    // Mock the initial upload URL fetch
    mockFetch.mockReset();
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://mock-upload-url.com', assetId: 'mock-asset-id' })
      })
    );
    
    // Mock the asset status fetch to return a response without playback ID
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'ready', 
          playbackId: null 
        })
      })
    );
    
    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={onErrorMock}
      />
    );

    // Wait for the upload URL to be fetched
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    });

    // Click the upload button to start the upload
    fireEvent.click(screen.getByRole('button', { name: /upload video/i }));
    
    // Simulate success event
    fireEvent.click(screen.getByTestId('simulate-success'));
    
    // Wait for the asset status to be fetched and error to be handled
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock.mock.calls[0][0].message).toBe('No playback ID available');
    });
  });

  // Test for retry logic when fetching upload URL fails
  it('retries fetching upload URL when it fails', async () => {
    jest.useFakeTimers();
    const onErrorMock = jest.fn();
    
    // Mock fetch to fail twice then succeed
    mockFetch.mockReset();
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://mock-upload-url.com', assetId: 'mock-asset-id' })
      })
    );
    
    render(
      <VideoUploader 
        onUploadComplete={jest.fn()} 
        onError={onErrorMock}
      />
    );

    // Fast-forward through retries
    await act(async () => {
      jest.advanceTimersByTime(1000); // First retry
      jest.advanceTimersByTime(2000); // Second retry
    });

    // Wait for the upload URL to be fetched successfully
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
