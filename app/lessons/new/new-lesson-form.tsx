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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
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
    
    // Get the form element
    const form = e.currentTarget as HTMLFormElement;
    
    // Check if the form is valid
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
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
      // Create a FormData object from the form
      const formData = new FormData(form);
      
      // Extract values from FormData
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const content = formData.get('content') as string;
      const priceStr = formData.get('price') as string;
      const price = parseFloat(priceStr || '0') || 0;
      
      // Create lesson data object
      const lessonData = {
        title,
        description,
        content,
        price,
        muxAssetId
      };
      
      // Validate required fields
      if (!lessonData.title || !lessonData.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!lessonData.description || !lessonData.description.trim()) {
        throw new Error('Description is required');
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
  
  // Handle upload start
  const handleUploadStart = () => {
    setIsUploading(true);
    setUploadError(null);
    console.log("Upload started");
  };
  
  // Handle upload success
  const handleUploadSuccess = (event: any) => {
    console.log("Upload success event:", event);
    setIsUploading(false);
    
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
      setUploadError('Upload completed but we could not identify the video');
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
              {uploadComplete ? (
                <div className="flex items-center text-green-600 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Video uploaded successfully
                </div>
              ) : null}
              
              {isUploading ? (
                <div className="flex items-center text-blue-600 mb-2">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Uploading video...
                </div>
              ) : null}
              
              {uploadError ? (
                <div className="flex items-center text-red-600 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {uploadError}
                </div>
              ) : null}
              
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
                    setUploadError('Failed to get upload URL');
                    return '';
                  }
                }}
                onStart={handleUploadStart}
                onSuccess={handleUploadSuccess}
                onError={(error) => {
                  console.error("Upload error:", error);
                  setIsUploading(false);
                  setUploadError('Upload failed');
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
          disabled={isSubmitting || !uploadComplete || isUploading}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Creating...
            </>
          ) : isUploading ? (
            'Uploading Video...'
          ) : !uploadComplete ? (
            'Upload Video First'
          ) : (
            'Create Lesson'
          )}
        </Button>
      </div>
    </form>
  );
}
