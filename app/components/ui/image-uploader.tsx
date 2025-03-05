"use client";

import { useState, useRef } from 'react';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Loader2, X, Image as ImageIcon } from 'lucide-react';
import { useImageUpload } from '@/app/hooks/use-image-upload';
import Image from 'next/image';
import { Progress } from '@/app/components/ui/progress';

interface ImageUploaderProps {
  initialImage?: string;
  onUploadComplete: (url: string) => void;
  onError: (error: Error) => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function ImageUploader({
  initialImage,
  onUploadComplete,
  onError,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    uploadImage,
    isUploading,
    progress,
    error
  } = useImageUpload({
    maxSizeMB,
    acceptedTypes,
    onUploadComplete: (url) => {
      setPreviewUrl(url);
      onUploadComplete(url);
    },
    onError,
    onProgress: (progress) => {
      console.log(`Upload progress: ${progress}%`);
    }
  });
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // Create a local preview immediately for better UX
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Upload the file using our server-side API
      await uploadImage(file);
      
      // Clean up the object URL after successful upload
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      // Error is handled by the hook
      console.error("File upload error:", err);
      // If upload fails, clear the preview
      setPreviewUrl(null);
    } finally {
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    try {
      // Create a local preview immediately for better UX
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Upload the file using our server-side API
      await uploadImage(file);
      
      // Clean up the object URL after successful upload
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      // Error is handled by the hook
      console.error("File drop error:", err);
      // If upload fails, clear the preview
      setPreviewUrl(null);
    }
  };
  
  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onUploadComplete(''); // Clear the image URL in the parent component
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <input
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        disabled={isUploading}
      />
      
      {previewUrl ? (
        <div className="relative aspect-video w-full max-w-md mx-auto border rounded-md overflow-hidden">
          <Image
            src={previewUrl}
            alt="Thumbnail preview"
            fill
            className="object-cover"
            unoptimized={previewUrl.startsWith('blob:') || previewUrl.includes('supabase')} // Skip optimization for blob URLs and Supabase URLs
            sizes="(max-width: 768px) 100vw, 400px"
          />
          
          {!isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              <div className="w-3/4 bg-black/30 rounded-full overflow-hidden">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-white font-medium">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors max-w-md mx-auto"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                <div className="w-full max-w-xs">
                  <Progress value={progress} className="h-2 mb-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Uploading... {Math.round(progress)}%
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP (max {maxSizeMB}MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive mt-2">
          {error.message}
        </p>
      )}
    </div>
  );
}
