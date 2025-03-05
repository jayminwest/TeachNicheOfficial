"use client";

import { useState, useRef } from 'react';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useImageUpload } from '@/app/hooks/use-image-upload';
import Image from 'next/image';

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
    onError
  });
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Upload the file
    await uploadImage(file);
    
    // Clean up the object URL
    URL.revokeObjectURL(objectUrl);
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      onError(new Error(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`));
      return;
    }
    
    // Create a local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Upload the file
    await uploadImage(file);
    
    // Clean up the object URL
    URL.revokeObjectURL(objectUrl);
  };
  
  const handleRemoveImage = () => {
    setPreviewUrl(null);
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
      />
      
      {previewUrl ? (
        <div className="relative aspect-video w-full max-w-md mx-auto border rounded-md overflow-hidden">
          <Image
            src={previewUrl}
            alt="Thumbnail preview"
            fill
            className="object-cover"
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
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              <span className="ml-2 text-white font-medium">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors max-w-md mx-auto"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
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
