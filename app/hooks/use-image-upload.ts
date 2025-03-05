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
      setProgress(0);
      setError(null);
      
      // Generate a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filename = `${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const path = folder ? `${folder}/${filename}` : filename;
      
      // Get the Supabase client
      const supabase = createClientSupabaseClient();
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      const publicUrl = urlData.publicUrl;
      
      setImageUrl(publicUrl);
      setProgress(100);
      onUploadComplete?.(publicUrl);
      
      return publicUrl;
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
