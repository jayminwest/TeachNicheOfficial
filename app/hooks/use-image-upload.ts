import { useState } from 'react';

interface UseImageUploadOptions {
  maxSizeMB?: number;
  acceptedTypes?: string[];
  onUploadComplete?: (url: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function useImageUpload({
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  onUploadComplete,
  onError,
  onProgress
}: UseImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const uploadImage = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      const error = new Error(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`);
      setError(error);
      onError?.(error);
      return;
    }
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      const error = new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
      setError(error);
      onError?.(error);
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      // Start progress simulation
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress >= 90) {
          clearInterval(progressInterval);
          currentProgress = 90; // Cap at 90% until actual completion
        }
        setProgress(currentProgress);
        onProgress?.(currentProgress);
      }, 200);
      
      // Create form data for the file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload via server API endpoint instead of direct Supabase client
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      // Clear the progress interval
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload API error:", errorData);
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      console.log("Upload successful:", data);
      
      // Set final progress
      setProgress(100);
      onProgress?.(100);
      
      // Set the image URL and call the completion callback
      setImageUrl(data.url);
      onUploadComplete?.(data.url);
      
      return data.url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown upload error');
      console.error("Upload error:", error);
      setError(error);
      onError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
    progress,
    error,
    imageUrl
  };
}
