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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [muxAssetId, setMuxAssetId] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const { createClientSupabaseClient } = await import('@/app/lib/supabase/client');
        const supabase = createClientSupabaseClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
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
      
      // Create lesson
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      
      // Start background video processing
      fetch('/api/lessons/process-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lessonId: lesson.id,
          muxAssetId: lessonData.muxAssetId,
          isPaid: lessonData.price > 0
        }),
      }).catch(error => {
        console.error('Failed to start background processing:', error);
      });
      
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
  const handleUploadSuccess = (event: any) => {
    // Check if event has detail property with assetId
    if (event && event.detail && event.detail.asset_id) {
      setMuxAssetId(event.detail.asset_id);
      setUploadComplete(true);
      
      toast({
        title: 'Upload Complete',
        description: 'Your video has been uploaded successfully!',
        duration: 3000,
      });
    } else {
      console.error('Upload success event missing asset_id:', event);
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
              endpoint={() => fetch('/api/mux/upload-url').then(res => res.json()).then(data => data.url)}
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
