import { render, screen, fireEvent } from '@testing-library/react';
import { LessonForm } from '../lesson-form';
import { act } from 'react-dom/test-utils';
import * as React from 'react';

// Mock the components and hooks used in LessonForm
jest.mock('../markdown-editor', () => ({
  MarkdownEditor: ({ value, onChange }: { value: string; onChange: (value?: string) => void }) => (
    <div data-testid="markdown-editor">
      <textarea 
        data-testid="mock-markdown-editor" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

jest.mock('../image-uploader', () => ({
  ImageUploader: ({ onUploadComplete }: { 
    initialImage?: string; 
    onUploadComplete: (url: string) => void;
    onError: (error: Error) => void;
  }) => (
    <div data-testid="image-uploader">
      <button 
        data-testid="upload-image-button" 
        onClick={() => onUploadComplete('https://example.com/image.jpg')}
      >
        Upload Image
      </button>
    </div>
  ),
}));

jest.mock('../video-uploader', () => ({
  VideoUploader: ({ onUploadComplete }: { 
    onUploadComplete: (assetId: string) => void;
    onError: (error: Error) => void;
  }) => (
    <div data-testid="video-uploader">
      <button 
        data-testid="upload-video-button" 
        onClick={() => onUploadComplete('test-asset-id')}
      >
        Upload Video
      </button>
    </div>
  ),
}));

jest.mock('../use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch for Stripe account check
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      stripeAccountId: 'test-stripe-id', 
      isComplete: true 
    }),
  })
) as jest.Mock;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock toast
const mockToast = jest.fn();
jest.mock('../use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('LessonForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with default values', () => {
    render(<LessonForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText(/Lesson Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
    expect(screen.getByTestId('video-uploader')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Lesson/i })).toBeInTheDocument();
  });

  it('renders with initial data when provided', () => {
    const initialData = {
      title: 'Test Lesson',
      description: 'Test Description',
      content: 'Test Content',
      price: 9.99,
      thumbnail_url: 'https://example.com/thumbnail.jpg',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      muxAssetId: 'test-asset-id',
      muxPlaybackId: 'test-playback-id',
    };

    render(<LessonForm initialData={initialData} onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText(/Lesson Title/i)).toHaveValue('Test Lesson');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Test Description');
    expect(screen.getByTestId('mock-markdown-editor')).toHaveValue('Test Content');
    expect(screen.getByLabelText(/Price/i)).toHaveValue(9.99);
  });

  it('shows editing state when isEditing is true', () => {
    render(<LessonForm onSubmit={jest.fn()} isEditing={true} />);
    
    expect(screen.getByRole('button', { name: /Update Lesson/i })).toBeInTheDocument();
  });

  it('shows submitting state when isSubmitting is true', () => {
    render(<LessonForm onSubmit={jest.fn()} isSubmitting={true} />);
    
    expect(screen.getByRole('button', { name: /Creating Lesson/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Creating Lesson/i })).toBeDisabled();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    const mockSubmit = jest.fn().mockImplementation(() => Promise.resolve());
    
    // Use act for the initial render to handle useEffect calls
    await act(async () => {
      render(<LessonForm onSubmit={mockSubmit} />);
    });
    
    // Fill out the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Lesson Title/i), { target: { value: 'New Lesson' } });
      fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'This is a new lesson description that is long enough to pass validation.' } });
      fireEvent.change(screen.getByTestId('mock-markdown-editor'), { target: { value: 'Lesson content goes here' } });
      fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '19.99' } });
    });
    
    // Submit the form using the form's submit event
    await act(async () => {
      const form = screen.getByTestId('lesson-form');
      fireEvent.submit(form);
    });
    
    // The mockSubmit should have been called
    expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Lesson',
      description: 'This is a new lesson description that is long enough to pass validation.',
      content: 'Lesson content goes here',
      price: 19.99,
    }));
  });

  it('handles image upload', async () => {
    // Clear mocks before test
    jest.clearAllMocks();
    
    // Use act for the initial render
    await act(async () => {
      render(<LessonForm onSubmit={jest.fn()} />);
    });
    
    // Trigger image upload with act
    await act(async () => {
      fireEvent.click(screen.getByTestId('upload-image-button'));
    });
    
    // Verify the toast was called (which happens on successful upload)
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Thumbnail uploaded"
      })
    );
  });

  it('handles video upload', async () => {
    // Clear mocks before test
    jest.clearAllMocks();
    
    // Use act for the initial render
    await act(async () => {
      render(<LessonForm onSubmit={jest.fn()} />);
    });
    
    // Trigger video upload with act
    await act(async () => {
      fireEvent.click(screen.getByTestId('upload-video-button'));
    });
    
    // Verify sessionStorage was called
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('lastMuxAssetId', 'test-asset-id');
    
    // Verify the toast was called
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Video uploaded"
      })
    );
  });

  it('checks for Stripe account when setting price > 0', async () => {
    // Use act for the initial render
    await act(async () => {
      render(<LessonForm onSubmit={jest.fn()} />);
    });
    
    // Set a price > 0 with act
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '19.99' } });
    });
    
    // Verify fetch was called and text is displayed
    expect(global.fetch).toHaveBeenCalledWith('/api/profile/stripe-status');
    expect(screen.getByText(/Stripe account connected and ready for payments/i)).toBeInTheDocument();
  });

  it('applies custom className when provided', async () => {
    // Use act for the render
    await act(async () => {
      render(<LessonForm onSubmit={jest.fn()} className="custom-class" />);
    });
    
    const form = screen.getByTestId('lesson-form');
    expect(form).toHaveClass('custom-class');
  });
});
