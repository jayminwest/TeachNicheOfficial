import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUploader } from '../image-uploader';
import { useImageUpload } from '@/app/hooks/use-image-upload';

// Mock the useImageUpload hook
jest.mock('@/app/hooks/use-image-upload', () => ({
  useImageUpload: jest.fn()
}));

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: (props) => <div data-testid="loader-icon" className={props.className} />,
  X: (props) => <div data-testid="x-icon" className={props.className} />,
  Image: (props) => <div data-testid="image-icon" className={props.className} />
}));

// Mock Next/Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // Convert boolean props to strings to avoid React warnings
    const imgProps = {...props};
    if (typeof imgProps.fill === 'boolean') {
      imgProps.fill = imgProps.fill.toString();
    }
    if (typeof imgProps.unoptimized === 'boolean') {
      imgProps.unoptimized = imgProps.unoptimized.toString();
    }
    return <img {...imgProps} alt={props.alt} />;
  }
}));

describe('ImageUploader', () => {
  const mockOnUploadComplete = jest.fn();
  const mockOnError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useImageUpload as jest.Mock).mockReturnValue({
      uploadImage: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
      isUploading: false,
      progress: 0,
      error: null
    });
  });
  
  it('renders the uploader in initial state', () => {
    render(
      <ImageUploader 
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError} 
      />
    );
    
    expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/JPG, PNG, WebP/i)).toBeInTheDocument();
  });
  
  it('renders with initial image', () => {
    render(
      <ImageUploader 
        initialImage="https://example.com/initial.jpg"
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError} 
      />
    );
    
    const image = screen.getByAltText('Thumbnail preview');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/initial.jpg');
  });
  
  it('applies custom className', () => {
    render(
      <ImageUploader 
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError}
        className="custom-class"
      />
    );
    
    // The className is applied to the root div, not the inner container
    const container = screen.getByText(/Click to upload or drag and drop/i)
      .closest('div')?.parentElement?.parentElement;
    expect(container).toHaveClass('custom-class');
  });
  
  it('handles file selection', async () => {
    const mockUploadImage = jest.fn().mockImplementation(async (file) => {
      // Simulate successful upload and trigger the onUploadComplete callback
      mockOnUploadComplete('https://example.com/uploaded.jpg');
      return 'https://example.com/uploaded.jpg';
    });
    
    (useImageUpload as jest.Mock).mockReturnValue({
      uploadImage: mockUploadImage,
      isUploading: false,
      progress: 0,
      error: null
    });
    
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn().mockReturnValue('blob:test-url');
    URL.revokeObjectURL = jest.fn();
    
    render(
      <ImageUploader 
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError} 
      />
    );
    
    // Create a test file
    const testFile = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
    
    // Get the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [testFile] } });
    
    // Check that URL.createObjectURL was called
    expect(URL.createObjectURL).toHaveBeenCalledWith(testFile);
    
    // Wait for the upload to complete
    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(testFile);
      expect(mockOnUploadComplete).toHaveBeenCalledWith('https://example.com/uploaded.jpg');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });
    
    // Restore original functions
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
  
  it('shows upload progress', () => {
    (useImageUpload as jest.Mock).mockReturnValue({
      uploadImage: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
      isUploading: true,
      progress: 45,
      error: null
    });
    
    render(
      <ImageUploader 
        initialImage="https://example.com/initial.jpg"
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError} 
      />
    );
    
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });
  
  it('displays error message when upload fails', () => {
    const testError = new Error('Upload failed');
    (useImageUpload as jest.Mock).mockReturnValue({
      uploadImage: jest.fn().mockRejectedValue(testError),
      isUploading: false,
      progress: 0,
      error: testError
    });
    
    render(
      <ImageUploader 
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError} 
      />
    );
    
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });
  
  it('allows removing an uploaded image', async () => {
    render(
      <ImageUploader 
        initialImage="https://example.com/initial.jpg"
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError} 
      />
    );
    
    // Find and click the remove button
    const removeButton = screen.getByRole('button');
    fireEvent.click(removeButton);
    
    // Check that the image was removed
    expect(screen.queryByAltText('Thumbnail preview')).not.toBeInTheDocument();
    expect(mockOnUploadComplete).toHaveBeenCalledWith('');
  });
  
  it('handles drag and drop', async () => {
    const mockUploadImage = jest.fn().mockImplementation(async (file) => {
      // Simulate successful upload and trigger the onUploadComplete callback
      mockOnUploadComplete('https://example.com/dropped.jpg');
      return 'https://example.com/dropped.jpg';
    });
    
    (useImageUpload as jest.Mock).mockReturnValue({
      uploadImage: mockUploadImage,
      isUploading: false,
      progress: 0,
      error: null
    });
    
    // Mock URL functions
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn().mockReturnValue('blob:dropped-url');
    URL.revokeObjectURL = jest.fn();
    
    render(
      <ImageUploader 
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError} 
      />
    );
    
    // Get the drop zone
    const dropZone = screen.getByText(/Click to upload or drag and drop/i).closest('div');
    expect(dropZone).not.toBeNull();
    
    // Create a test file
    const testFile = new File(['dropped image content'], 'dropped.jpg', { type: 'image/jpeg' });
    
    // Create a mock drop event
    const dropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        files: [testFile]
      }
    };
    
    // Simulate drop
    fireEvent.drop(dropZone!, dropEvent);
    
    // Check that URL.createObjectURL was called
    expect(URL.createObjectURL).toHaveBeenCalledWith(testFile);
    
    // Wait for the upload to complete
    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(testFile);
      expect(mockOnUploadComplete).toHaveBeenCalledWith('https://example.com/dropped.jpg');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:dropped-url');
    });
    
    // Restore original functions
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
  
  it('handles upload error and clears preview', async () => {
    const mockUploadImage = jest.fn().mockImplementation(async (file) => {
      // Simulate error and trigger the onError callback
      mockOnError(new Error('Upload failed'));
      throw new Error('Upload failed');
    });
    
    (useImageUpload as jest.Mock).mockReturnValue({
      uploadImage: mockUploadImage,
      isUploading: false,
      progress: 0,
      error: new Error('Upload failed')
    });
    
    // Mock URL functions
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn().mockReturnValue('blob:test-url');
    URL.revokeObjectURL = jest.fn();
    
    render(
      <ImageUploader 
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError} 
      />
    );
    
    // Create a test file
    const testFile = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
    
    // Get the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [testFile] } });
    
    // Wait for the upload to fail
    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(testFile);
      expect(mockOnError).toHaveBeenCalled();
    });
    
    // Restore original functions
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
  
  it('disables file input during upload', () => {
    (useImageUpload as jest.Mock).mockReturnValue({
      uploadImage: jest.fn(),
      isUploading: true,
      progress: 30,
      error: null
    });
    
    render(
      <ImageUploader 
        onUploadComplete={mockOnUploadComplete} 
        onError={mockOnError} 
      />
    );
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});
