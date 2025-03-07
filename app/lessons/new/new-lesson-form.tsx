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
      // Get upload URL from API
      const uploadResponse = await fetch('/api/mux/upload-url');
      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadUrl, assetId } = await uploadResponse.json();
      setMuxAssetId(assetId);
      
      // Upload file directly to Mux
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: formData,
      });
      
      if (!uploadResult.ok) {
        throw new Error('Failed to upload video');
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
    try {
      const statusResponse = await fetch(`/api/mux/asset-status?assetId=${assetId}`);
      if (!statusResponse.ok) {
        throw new Error('Failed to check asset status');
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
