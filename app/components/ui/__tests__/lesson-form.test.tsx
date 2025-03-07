import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  ImageUploader: ({ initialImage, onUploadComplete }: { 
    initialImage: string; 
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
});

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
    const mockSubmit = jest.fn();
    
    render(<LessonForm onSubmit={mockSubmit} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Lesson Title/i), { target: { value: 'New Lesson' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'This is a new lesson description that is long enough to pass validation.' } });
    fireEvent.change(screen.getByTestId('mock-markdown-editor'), { target: { value: 'Lesson content goes here' } });
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '19.99' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Lesson/i }));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Lesson',
        description: 'This is a new lesson description that is long enough to pass validation.',
        content: 'Lesson content goes here',
        price: 19.99,
      }));
    });
  });

  it('handles image upload', async () => {
    render(<LessonForm onSubmit={jest.fn()} />);
    
    // Trigger image upload
    fireEvent.click(screen.getByTestId('upload-image-button'));
    
    await waitFor(() => {
      // Check that both thumbnail fields are set
      const form = screen.getByRole('form');
      expect(form).toHaveFormValues(expect.objectContaining({
        thumbnail_url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/image.jpg',
      }));
    });
  });

  it('handles video upload', async () => {
    render(<LessonForm onSubmit={jest.fn()} />);
    
    // Trigger video upload
    fireEvent.click(screen.getByTestId('upload-video-button'));
    
    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('lastMuxAssetId', 'test-asset-id');
    });
  });

  it('checks for Stripe account when setting price > 0', async () => {
    render(<LessonForm onSubmit={jest.fn()} />);
    
    // Set a price > 0
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '19.99' } });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile/stripe-status');
      expect(screen.getByText(/Stripe account connected and ready for payments/i)).toBeInTheDocument();
    });
  });

  it('applies custom className when provided', () => {
    render(<LessonForm onSubmit={jest.fn()} className="custom-class" />);
    
    const form = screen.getByRole('form');
    expect(form).toHaveClass('custom-class');
  });
});
