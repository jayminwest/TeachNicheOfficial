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

// Store the last upload ID globally for fallback access
if (typeof window !== 'undefined') {
  window.__lastUploadId = undefined;
}

interface NewLessonFormProps {
  redirectPath?: string;
}

export default function NewLessonForm({ redirectPath }: NewLessonFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [muxAssetId, setMuxAssetId] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  // Check authentication on mount and refresh the session
  useEffect(() => {
    async function checkAuth() {
      try {
        const { createClientSupabaseClient } = await import('@/app/lib/supabase/client');
        const supabase = createClientSupabaseClient();
        
        // First check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          window.location.href = '/auth?redirect=/lessons/new';
          return;
        }
        
        // Refresh the session to ensure we have a valid token
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh failed:', refreshError);
          window.location.href = '/auth?redirect=/lessons/new';
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = '/auth?redirect=/lessons/new';
      }
    }
    
    checkAuth();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Get form data
      const formData = new FormData(e.currentTarget);
      const lessonData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        content: formData.get('content') as string,
        price: parseFloat(formData.get('price') as string) || 0,
        muxAssetId,
        status: 'draft'
      };
      
      // Validate required fields
      if (!lessonData.title || !lessonData.description || !lessonData.content) {
        throw new Error('Missing required fields: title, description, and content are required');
      }
      
      // Check if video is uploaded
      if (!lessonData.muxAssetId) {
        throw new Error('Please upload a video before creating the lesson');
      }
      
      // Check if the ID is a temporary one
      lessonData.muxAssetId.startsWith('temp_');
      
      // Get a fresh auth token before making the request
      const { createClientSupabaseClient } = await import('@/app/lib/supabase/client');
      const supabase = createClientSupabaseClient();
      
      // Refresh the session to ensure we have a valid token
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Session refresh failed before API call:', refreshError);
        throw new Error('Your session has expired. Please sign in again.');
      }
      
      // Create lesson
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(lessonData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create lesson');
      }
      
      const lesson = await response.json();
      
      // Show success toast
      toast({
        title: 'Lesson Created!',
        description: 'Your new lesson has been created and your video is now processing.',
        duration: 5000,
      });
      
      // Start background video processing with fresh auth
      try {
        const { error: refreshError2 } = await supabase.auth.refreshSession();
        
        if (refreshError2) {
          console.warn('Session refresh failed before video processing:', refreshError2);
          // Continue anyway since the lesson was created
        }
        
        await fetch('/api/lessons/process-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            lessonId: lesson.id,
            muxAssetId: lessonData.muxAssetId,
            isPaid: lessonData.price > 0,
            isTemporaryId: lessonData.muxAssetId.startsWith('temp_')
          }),
        });
      } catch (processingError) {
        console.error('Failed to start background processing:', processingError);
        // Don't throw here, as the lesson was created successfully
      }
      
      // Redirect to the lesson page or custom redirect path
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
  const handleUploadSuccess = (event: { detail?: { uploadId?: string, asset_id?: string } }) => {
    console.log("Upload success event:", event);
    
    // Extract upload ID using multiple fallback approaches
    let uploadId: string | undefined;
    
    try {
      // First try to get it from the event
      if (event && event.detail && typeof event.detail === 'object') {
        const eventDetail = event.detail as { uploadId?: string, asset_id?: string };
        uploadId = eventDetail.uploadId || eventDetail.asset_id;
      }
      
      // Try to extract from the endpoint URL if available
      if (!uploadId && typeof window !== 'undefined') {
        // Check session storage for recently stored IDs
        uploadId = window.sessionStorage.getItem('lastMuxAssetId') || undefined;
      }
      
      // If we still don't have an ID, generate a temporary one
      if (!uploadId) {
        uploadId = `temp_${Date.now()}`;
        console.warn("No upload ID found, using generated temporary ID:", uploadId);
        
        // Store the temporary ID for reference
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('lastMuxAssetId', uploadId);
        }
      }
      
      setMuxAssetId(uploadId);
      setUploadComplete(true);
      
      toast({
        title: 'Upload Complete',
        description: 'Your video has been uploaded successfully!',
        duration: 3000,
      });
    } catch (error) {
      console.error("Error extracting upload ID:", error);
      toast({
        title: 'Upload Issue',
        description: 'Upload completed but asset information is missing. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="animate-pulse flex flex-col space-y-4">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-10 bg-muted rounded w-1/4 self-end"></div>
      </div>
    );
  }
  
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
            <MuxUploader
              endpoint={() => fetch('/api/mux/upload-url').then(res => res.json()).then(data => {
                // Store the endpoint URL for potential ID extraction later
                if (typeof window !== 'undefined' && data && data.url) {
                  // Extract and store upload ID if possible
                  try {
                    const uploadIdMatch = data.url.match(/\/([a-zA-Z0-9]+)$/);
                    if (uploadIdMatch && uploadIdMatch[1]) {
                      window.__lastUploadId = uploadIdMatch[1];
                      console.log("Extracted upload ID from URL:", window.__lastUploadId);
                    }
                  } catch (e) {
                    console.error("Error extracting upload ID from URL:", e);
                  }
                } else {
                  console.warn("No URL found in upload response:", data);
                }
                return data && data.url ? data.url : '';
              })}
              onSuccess={handleUploadSuccess}
              className="w-full"
            />
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