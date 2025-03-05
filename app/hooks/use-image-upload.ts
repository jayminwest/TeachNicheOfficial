import { useState } from 'react';
import { createClientSupabaseClient } from '@/app/services/supabase';

interface UseImageUploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  onUploadComplete?: (url: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function useImageUpload({
  bucket = 'lesson-media',
  folder = 'thumbnails',
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
      
      // Start progress simulation since Supabase doesn't provide progress events
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
      
      // Generate a unique filename with a shorter random string
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      // Use a shorter random string to avoid potential length issues
      const randomString = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}_${randomString}.${fileExtension}`;
      const path = folder ? `${folder}/${filename}` : filename;
      
      console.log("Uploading file to Supabase:", {
        bucket,
        path,
        fileType: file.type,
        fileSize: file.size
      });
      
      // Get the Supabase client
      const supabase = createClientSupabaseClient();
      
      // Upload the file with direct API call to debug
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: true // Allow overwriting
          });
        
        // Clear the progress interval
        clearInterval(progressInterval);
        
        if (error) {
          console.error("Supabase upload error:", error);
          throw error;
        }
        
        console.log("Upload successful:", data);
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        
        const publicUrl = urlData.publicUrl;
        
        // Set final progress
        setProgress(100);
        onProgress?.(100);
        
        setImageUrl(publicUrl);
        onUploadComplete?.(publicUrl);
        
        return publicUrl;
      } catch (innerError) {
        console.error("Error in inner try block:", innerError);
        throw innerError;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown upload error');
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
