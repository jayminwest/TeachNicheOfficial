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
      
      // Create lesson
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    
    // Extract upload ID with better fallback handling
    let uploadId: string | undefined;
    
    try {
      // Try to get it from the event detail
      if (event?.detail?.uploadId) {
        uploadId = event.detail.uploadId;
      } else if (event?.detail?.asset_id) {
        uploadId = event.detail.asset_id;
      } else if (typeof event?.detail === 'string') {
        // Sometimes the detail itself is the ID
        uploadId = event.detail;
      } else if (typeof event === 'string') {
        // Sometimes the entire event is the ID
        uploadId = event;
      }
      
      // If we still don't have an ID, check if it's in a nested property
      if (!uploadId && event?.detail) {
        // Try to find any property that might be an ID
        const detail = event.detail;
        for (const key in detail) {
          if (typeof detail[key] === 'string' && 
              (key.includes('id') || key.includes('Id') || key.includes('ID'))) {
            uploadId = detail[key];
            break;
          }
        }
      }
      
      // If we still don't have an ID, generate a temporary one
      if (!uploadId) {
        uploadId = `temp_${Date.now()}`;
        console.warn("No upload ID found in event, using generated ID:", uploadId);
      }
      
      setMuxAssetId(uploadId);
      setUploadComplete(true);
      
      toast({
        title: 'Upload Complete',
        description: 'Your video has been uploaded successfully!',
        duration: 3000,
      });
    } catch (error) {
      console.error("Error processing upload success:", error);
      toast({
        title: 'Upload Issue',
        description: 'Upload completed but there was an error processing the response. Using a temporary ID.',
        variant: 'destructive',
        duration: 5000,
      });
      
      // Use a fallback ID
      const fallbackId = `temp_${Date.now()}`;
      setMuxAssetId(fallbackId);
      setUploadComplete(true);
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
            <MuxUploader
              endpoint={() => fetch('/api/mux/upload-url')
                .then(res => res.json())
                .then(data => {
                  console.log("Upload URL response:", data);
                  if (data && data.url) {
                    // Try to extract ID from URL
                    try {
                      const urlParts = data.url.split('/');
                      const potentialId = urlParts[urlParts.length - 1];
                      if (potentialId && potentialId.length > 5) {
                        console.log("Extracted potential ID from URL:", potentialId);
                        // Store for later reference
                        window.sessionStorage.setItem('lastMuxUploadId', potentialId);
                      }
                    } catch (e) {
                      console.error("Error extracting ID from URL:", e);
                    }
                    return data.url;
                  } else {
                    console.warn("No URL in response:", data);
                    return '';
                  }
                })
                .catch(err => {
                  console.error("Error getting upload URL:", err);
                  return '';
                })
              }
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
