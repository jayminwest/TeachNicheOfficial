"use client";

import { LessonForm } from "@/app/components/ui/lesson-form";
import { toast } from "@/app/components/ui/use-toast";
import { Toaster } from "@/app/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/services/auth/AuthContext";
import { Loader2 } from "lucide-react";

export default function NewLessonPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a lesson",
        variant: "destructive",
      });
      // Use callbackUrl instead of redirect for Next.js compatibility
      router.push('/sign-in?callbackUrl=/lessons/new');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    muxAssetId?: string;
    muxPlaybackId?: string;
    price?: number;
  }) => {
    setIsSubmitting(true);
    try {
      // Check authentication - use the user from context instead of fetching again
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create a lesson",
          variant: "destructive",
        });
        setIsSubmitting(false);
        // Use callbackUrl instead of redirect for Next.js compatibility
        router.push('/sign-in?callbackUrl=/lessons/new');
        return;
      }
      
      // Note: Stripe account verification is now handled in the LessonForm component
      // so we don't need to check it again here
      
      console.log("Form submission data:", data); // Debug submission data
      
      // Add debug log for Stripe verification
      if (data.price && data.price > 0) {
        console.log("Stripe verification handled by LessonForm component");
      }

      // Check if muxAssetId exists and is not empty
      if (!data.muxAssetId || data.muxAssetId.trim() === "") {
        console.error("Missing muxAssetId in form submission");
        toast({
          title: "Video Required",
          description: "Please upload a video before creating the lesson",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Don't require playbackId - it will be set when processing completes
      // Just log that we're proceeding with a processing video
      if (!data.muxPlaybackId || data.muxPlaybackId.trim() === "") {
        console.log("Creating lesson with processing video (no playbackId yet)");
        // Set a flag to indicate video is still processing
        data.videoProcessing = true;
        // Set status to published by default
        data.status = 'published';
      }
      
      // Handle temporary asset IDs
      const isTemporaryAsset = data.muxAssetId.startsWith('temp_');
      if (isTemporaryAsset) {
        console.log("Using temporary asset ID:", data.muxAssetId);
        // Extract the upload ID from the temporary asset ID
        const uploadId = data.muxAssetId.substring(5);
        
        // Set a flag to indicate this is a temporary asset
        data.isTemporaryAsset = true;
        data.uploadId = uploadId;
      }

      // Create lesson data object - set status to 'published' instead of 'draft'
      // This ensures lessons are published by default
      const lessonData = {
        ...data,
        status: 'published'
      };

      // Ensure we have the required fields
      if (!lessonData.title || !lessonData.description || !lessonData.content) {
        throw new Error('Missing required fields: title, description, and content are required');
      }

      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lessonData),
      });

      let errorData;
      if (!response.ok) {
        try {
          errorData = await response.json();
          console.error('API Error Response:', errorData);
            
          // Handle validation errors specifically
          if (errorData.error === 'Validation error' && errorData.details) {
            const errorMessages: string[] = [];
              
            // Extract field-specific errors
            if (errorData.details.title) {
              errorMessages.push(`Title: ${errorData.details.title._errors.join(', ')}`);
            }
            if (errorData.details.description) {
              errorMessages.push(`Description: ${errorData.details.description._errors.join(', ')}`);
            }
            if (errorData.details.content) {
              errorMessages.push(`Content: ${errorData.details.content._errors.join(', ')}`);
            }
            if (errorData.details.status) {
              errorMessages.push(`Status: ${errorData.details.status._errors.join(', ')} (valid values: draft, published, archived)`);
            }
              
            // If we have specific field errors, show them
            if (errorMessages.length > 0) {
              throw new Error(`Validation failed: ${errorMessages.join('; ')}`);
            }
          }
            
          // For other errors, use the provided message or a generic one
          const errorMessage = 
            errorData.details ? 
              (typeof errorData.details === 'string' ? 
                errorData.details : 
                JSON.stringify(errorData.details)
              ) : 
              errorData.message || 
              `Failed to create lesson: ${response.statusText}`;
            
          throw new Error(errorMessage);
        } catch {
          if (errorData) {
            const errorMessage = 
              errorData.details ? 
                (typeof errorData.details === 'string' ? 
                  errorData.details : 
                  JSON.stringify(errorData.details)
                ) : 
                errorData.message || 
                `Failed to create lesson: ${response.statusText}`;
            
            throw new Error(errorMessage);
          } else {
            throw new Error(`Failed to create lesson: ${response.statusText}`);
          }
        }
      }

      const lesson = await response.json();
      
      toast({
        title: "Lesson Created!",
        description: "Your new lesson has been created and your video is now processing.",
      });

      // Start background video processing
      fetch('/api/lessons/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          muxAssetId: data.muxAssetId,
          isPaid: data.price && data.price > 0,
          // Include the current status for reference
          currentStatus: 'draft'
        }),
      }).catch(error => {
        console.error('Failed to start background processing:', error);
        // Don't block the user flow if background processing fails to start
      });

      // Redirect to the lesson page
      router.push(`/lessons/${lesson.id}`);
    } catch (error) {
      console.error('Lesson creation error:', error);
      
      // Improved error handling to better display the error
      let errorMessage = "There was an error creating your lesson. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract a meaningful message from the error object
        errorMessage = JSON.stringify(error);
      }
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Don't render the form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10">
          <p className="text-muted-foreground">Redirecting to sign in page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Create New Lesson
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Share your knowledge with the world. Fill out the form below to create your new lesson.
            </p>
          </div>
          <div className="bg-card rounded-lg border shadow-sm p-6 md:p-8">
            <LessonForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
