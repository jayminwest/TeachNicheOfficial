'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/app/components/ui/use-toast';
import dynamic from 'next/dynamic';

// Dynamically import MuxUploader to avoid SSR issues
const MuxUploader = dynamic(
  () => import('@mux/mux-uploader-react').then((mod) => mod.default),
  { ssr: false }
);

interface NewLessonFormProps {
  redirectPath?: string;
}

export default function NewLessonForm({ redirectPath }: NewLessonFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [muxAssetId, setMuxAssetId] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  // Check authentication status
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const authInfo = await response.json();
        console.log('Authentication status:', authInfo);
        return authInfo.authenticated;
      } else {
        console.error('Auth check failed:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create a lesson.',
        variant: 'destructive',
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Get form data directly from the form elements
      const form = e.currentTarget;
      const titleInput = form.querySelector('#title') as HTMLInputElement;
      const descriptionInput = form.querySelector('#description') as HTMLTextAreaElement;
      const contentInput = form.querySelector('#content') as HTMLTextAreaElement;
      const priceInput = form.querySelector('#price') as HTMLInputElement;
      
      const lessonData = {
        title: titleInput?.value || '',
        description: descriptionInput?.value || '',
        content: contentInput?.value || '',
        price: parseFloat(priceInput?.value || '0') || 0,
        muxAssetId
      };
      
      // Validate required fields
      if (!lessonData.title || !lessonData.description) {
        throw new Error('Title and description are required');
      }
      
      // Check if video is uploaded
      if (!lessonData.muxAssetId) {
        throw new Error('Please upload a video before creating the lesson');
      }
      
      console.log('Submitting lesson data:', {
        ...lessonData,
        content: lessonData.content ? `${lessonData.content.substring(0, 20)}...` : ''
      });
      
      // Create lesson
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include credentials for authentication
        body: JSON.stringify(lessonData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || 'Failed to create lesson');
      }
      
      const lesson = await response.json();
      
      // Show success toast
      toast({
        title: 'Lesson Created!',
        description: 'Your new lesson has been created successfully.',
        duration: 5000,
      });
      
      // Redirect to the lesson page
      window.location.href = redirectPath || `/lessons/${lesson.id}`;
    } catch (error) {
      console.error('Lesson creation error:', error);
      
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'There was an error creating your lesson.',
        variant: 'destructive',
        duration: 5000,
      });
      
      setIsSubmitting(false);
    }
  };
  
  // Handle upload success
  const handleUploadSuccess = (event: any) => {
    console.log("Upload success event:", event);
    
    // Get the upload ID from session storage - this is the most reliable method
    const uploadId = window.sessionStorage.getItem('lastMuxUploadId');
    
    if (uploadId) {
      console.log("Using upload ID from session storage:", uploadId);
      setMuxAssetId(uploadId);
      setUploadComplete(true);
      
      toast({
        title: 'Upload Complete',
        description: 'Your video has been uploaded successfully!',
        duration: 3000,
      });
    } else {
      console.error("No upload ID found in session storage");
      toast({
        title: 'Upload Issue',
        description: 'Upload completed but we could not identify the video. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">Title</label>
        <input 
          type="text" 
          id="title" 
          name="title"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter lesson title"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <textarea 
          id="description" 
          name="description"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter lesson description"
          required
        ></textarea>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-medium">Content</label>
        <textarea 
          id="content" 
          name="content"
          rows={6}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter lesson content in markdown format"
          required
        ></textarea>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="price" className="block text-sm font-medium">Price ($)</label>
        <input 
          type="number" 
          id="price" 
          name="price"
          min="0"
          step="0.01"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="0.00"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Video Upload</label>
        <div className="border rounded-md p-4">
          {typeof window !== 'undefined' && (
            <>
              <MuxUploader
                endpoint={async () => {
                  try {
                    const response = await fetch('/api/mux/upload-url');
                    const data = await response.json();
                    
                    console.log("Upload URL response:", data);
                    
                    if (data && data.url) {
                      // Extract the upload ID from the URL - this is the most reliable method
                      // The URL format is typically: https://storage.mux.com/api/video/v1/uploads/{UPLOAD_ID}
                      const urlParts = data.url.split('/');
                      let uploadId = urlParts[urlParts.length - 1];
                      
                      // Remove any query parameters
                      if (uploadId.includes('?')) {
                        uploadId = uploadId.split('?')[0];
                      }
                      
                      if (uploadId && uploadId.length > 5) {
                        console.log("Successfully extracted upload ID from URL:", uploadId);
                        // Store it in session storage for later use
                        window.sessionStorage.setItem('lastMuxUploadId', uploadId);
                      } else {
                        console.warn("Could not extract valid upload ID from URL");
                      }
                      
                      return data.url;
                    } else {
                      console.warn("No URL in response:", data);
                      return '';
                    }
                  } catch (err) {
                    console.error("Error getting upload URL:", err);
                    return '';
                  }
                }}
                onSuccess={handleUploadSuccess}
                onError={(error) => {
                  console.error("Upload error:", error);
                  toast({
                    title: 'Upload Failed',
                    description: 'There was an error uploading your video. Please try again.',
                    variant: 'destructive',
                    duration: 5000,
                  });
                }}
                className="w-full"
              />
              <div className="mt-2 text-xs text-muted-foreground">
                Supported formats: MP4, MOV, AVI, WebM (max 2GB)
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || !uploadComplete}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Creating...
            </>
          ) : 'Create Lesson'}
        </Button>
      </div>
    </form>
  );
}
