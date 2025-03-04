"use client";

import { LessonForm } from "@/app/components/ui/lesson-form";
import { toast } from "@/app/components/ui/use-toast";
import { Toaster } from "@/app/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/app/services/supabase";
import { waitForAssetReady } from "@/app/services/mux";
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
      router.push('/sign-in?redirect=/lessons/new');
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
      // Check authentication
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create a lesson",
          variant: "destructive",
        });
        setIsSubmitting(false);
        router.push('/sign-in?redirect=/lessons/new');
        return;
      }
      
      // For paid lessons, verify Stripe account
      if (data.price && data.price > 0) {
        const profileResponse = await fetch('/api/profile');
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const profile = await profileResponse.json();
        if (!profile.stripe_account_id) {
          toast({
            title: "Stripe Account Required",
            description: "You need to connect a Stripe account to create paid lessons",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
      console.log("Form submission data:", data); // Debug submission data

      // Check if muxAssetId exists and is not empty
      if (!data.muxAssetId || data.muxAssetId.trim() === "") {
        toast({
          title: "Video Required",
          description: "Please upload a video before creating the lesson",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Show initial processing status
      const processingToast = toast({
        title: "Processing Video",
        description: "Please wait while we process your video...",
        duration: 60000, // 1 minute
      });

      let result;
      try {
        console.log('Starting video processing for asset:', data.muxAssetId);
        
        // Wait for asset to be ready and get playback ID
        result = await waitForAssetReady(data.muxAssetId, {
          isFree: data.price === 0,
          maxAttempts: 60,  // 10 minutes total
          interval: 10000   // 10 seconds between checks
        });
        
        console.log('Video processing completed:', result);
        
        if (result.status !== 'ready' || !result.playbackId) {
          throw new Error('Video processing completed but no playback ID was generated');
        }

        // Dismiss the processing toast
        processingToast.dismiss();
        
        // Show success toast
        toast({
          title: "Video Processing Complete",
          description: "Your video has been processed successfully.",
        });

      } catch (error) {
        // Dismiss the processing toast
        processingToast.dismiss();
        
        console.error('Video processing error:', error);
        toast({
          title: "Video Processing Failed",
          description: error instanceof Error ? error.message : "Failed to process video. Please try again.",
          variant: "destructive",
          duration: 5000
        });
        setIsSubmitting(false);
        return;
      }

      // Create lesson data object with playback ID
      const lessonData = {
        ...data,
        muxPlaybackId: result.playbackId
      };

      // Verify session is still valid
      if (!session.data.session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create a lesson",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lessonData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(
          errorData.details || 
          errorData.message || 
          `Failed to create lesson: ${response.statusText}`
        );
      }

      const lesson = await response.json();
      
      toast({
        title: "Lesson Created!",
        description: "Your new lesson has been created successfully.",
      });

      router.push(`/lessons/${lesson.id}`);
    } catch (error) {
      console.error('Lesson creation error:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "There was an error creating your lesson. Please try again.",
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
