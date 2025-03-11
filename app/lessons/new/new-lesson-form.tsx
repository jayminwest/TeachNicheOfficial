'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Loader2, AlertCircle, Upload, Check } from 'lucide-react';
import { useToast } from '@/app/components/ui/use-toast';

interface NewLessonFormProps {
  redirectPath?: string;
}

export default function NewLessonForm({ redirectPath }: NewLessonFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [muxAssetId, setMuxAssetId] = useState<string | null>(null);
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadContainerRef = useRef<HTMLDivElement>(null);
  
  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        // Import dynamically to avoid SSR issues
        const { createClientSupabaseClient } = await import('@/app/lib/supabase/client');
        const supabase = createClientSupabaseClient();
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          throw new Error('Authentication error');
        }
        
        if (!session) {
          // No active session
          console.log('No active session found');
          window.location.href = '/auth?redirect=/lessons/new';
          return;
        }
        
        // User is authenticated
        setIsLoading(false);
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Show error in dev but don't redirect immediately in production
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: 'Authentication Error',
            description: 'Could not verify authentication status. This might be a temporary issue.',
            variant: 'destructive',
          });
        }
        
        // Set a timeout before redirecting to avoid immediate redirects on temporary issues
        setTimeout(() => {
          window.location.href = '/auth?redirect=/lessons/new';
        }, 1500);
      }
    }
    
    checkAuth();
  }, [toast]);
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setUploadStatus('uploading');
    setUploadError(null);
    
    try {
      // Get upload URL from API with credentials
      console.log('Requesting Mux upload URL...');
      const uploadResponse = await fetch('/api/mux/upload-url', {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      // Log the response for debugging
      console.log('Upload URL response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        // Try to get the error details
        const errorText = await uploadResponse.text();
        console.error('Upload URL error response:', errorText);
        
        // Try to parse as JSON if possible
        let errorMessage = 'Failed to get upload URL';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
          
          // If unauthorized, redirect to login
          if (uploadResponse.status === 401) {
            toast({
              title: 'Authentication Required',
              description: 'Please log in to upload videos.',
              variant: 'destructive',
            });
            
            // Redirect to auth page
            window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
          }
        } catch (e) {
          // If not JSON, use the raw text if available
          if (errorText) errorMessage += `: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await uploadResponse.json();
      console.log('Upload URL response data:', responseData);
      
      // Ensure we have the required fields
      if (!responseData.uploadUrl || !responseData.assetId) {
        throw new Error('Invalid response from upload URL endpoint: missing required fields');
      }
      
      const { uploadUrl, assetId } = responseData;
      setMuxAssetId(assetId);
      
      console.log('Uploading to Mux with URL:', uploadUrl);
      
      // Upload file directly to Mux
      // Note: Mux direct upload doesn't use FormData for PUT requests
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file, // Send the file directly as the request body
        headers: {
          'Content-Type': file.type, // Set the correct content type
        },
      });
      
      console.log('Upload result status:', uploadResult.status);
      
      if (!uploadResult.ok) {
        // Try to get more details about the error
        const errorText = await uploadResult.text().catch(() => '');
        console.error('Upload error response:', errorText);
        
        throw new Error(`Failed to upload video: ${uploadResult.status} ${uploadResult.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }
      
      // Update status
      setUploadStatus('processing');
      
      // Start checking asset status
      checkAssetStatus(assetId);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Failed to upload video');
    }
  };
  
  // Check asset status
  const checkAssetStatus = async (assetId: string) => {
    console.log('Checking asset status for:', assetId);
    
    // Add toast to the function scope
    const { toast } = useToast();
    try {
      const statusResponse = await fetch(`/api/mux/asset-status?assetId=${assetId}`, {
        credentials: 'include', // Include cookies for authentication
      });
      console.log('Asset status response:', statusResponse.status);
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text().catch(() => '');
        console.error('Asset status error:', errorText);
        
        // If unauthorized, redirect to login
        if (statusResponse.status === 401) {
          toast({
            title: 'Authentication Required',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive',
          });
          
          // Redirect to auth page
          window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        
        throw new Error(`Failed to check asset status: ${statusResponse.status} ${statusResponse.statusText}`);
      }
      
      const { status, playbackId } = await statusResponse.json();
      
      if (status === 'ready' && playbackId) {
        // Asset is ready
        setUploadStatus('ready');
        setMuxPlaybackId(playbackId);
      } else if (status === 'errored') {
        // Asset processing failed
        setUploadStatus('error');
        setUploadError('Video processing failed');
      } else {
        // Asset is still processing, check again in 5 seconds
        setTimeout(() => checkAssetStatus(assetId), 5000);
      }
    } catch (error) {
      console.error('Status check error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Failed to check video status');
    }
  };
  
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
        muxPlaybackId,
        status: 'published'
      };
      
      // Validate required fields
      if (!lessonData.title || !lessonData.description || !lessonData.content) {
        throw new Error('Missing required fields: title, description, and content are required');
      }
      
      // Check if video is uploaded
      if (!lessonData.muxAssetId) {
        throw new Error('Please upload a video before creating the lesson');
      }
      
      // Create lesson
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
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
      
      // Start background video processing
      fetch('/api/lessons/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          lessonId: lesson.id,
          muxAssetId: lessonData.muxAssetId,
          isPaid: lessonData.price > 0,
          currentStatus: 'draft'
        }),
      }).catch(error => {
        console.error('Failed to start background processing:', error);
      });
      
      // Redirect to the lesson page or custom redirect path
      window.location.href = redirectPath || `/lessons/${lesson.id}`;
    } catch (error) {
      console.error('Lesson creation error:', error);
      
      // Show error toast
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'There was an error creating your lesson. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
      
      setIsSubmitting(false);
    }
  };
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (uploadContainerRef.current) {
      uploadContainerRef.current.classList.remove('border-primary');
    }
    
    if (e.dataTransfer?.files.length) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFileUpload(e.target.files[0]);
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
        <div 
          ref={uploadContainerRef}
          className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-muted/50"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (uploadContainerRef.current) {
              uploadContainerRef.current.classList.add('border-primary');
            }
          }}
          onDragLeave={() => {
            if (uploadContainerRef.current) {
              uploadContainerRef.current.classList.remove('border-primary');
            }
          }}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Drag and drop your video file here or click to browse</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="video/*" 
            onChange={handleFileChange}
          />
        </div>
        
        {uploadStatus !== 'idle' && (
          <div className="mt-2 text-sm">
            {uploadStatus === 'uploading' && (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                <span>Uploading video...</span>
              </div>
            )}
            
            {uploadStatus === 'processing' && (
              <div className="flex items-center text-amber-600">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                <span>Video uploaded successfully! Processing...</span>
              </div>
            )}
            
            {uploadStatus === 'ready' && (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-2" />
                <span>Video processed and ready!</span>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Upload failed: {uploadError}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || uploadStatus === 'uploading' || uploadStatus === 'processing' || !muxAssetId}
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
