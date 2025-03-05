"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LessonForm } from "@/app/components/ui/lesson-form";
import { toast } from "@/app/components/ui/use-toast";

export default function CreateLessonPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  interface LessonFormData {
    title: string;
    description: string;
    content?: string;
    muxAssetId?: string;
    muxPlaybackId?: string;
    price?: number;
  }

  const handleSubmit = async (data: LessonFormData) => {
    try {
      setIsSubmitting(true);
      
      console.log("Form submission data:", data);
      
      // If we have an asset ID but no playback ID, the video is still processing
      // We should still allow the form to be submitted
      const isVideoProcessing = data.muxAssetId && (!data.muxPlaybackId || data.muxPlaybackId === "processing" || data.muxPlaybackId === "");
      
      if (isVideoProcessing) {
        console.log("Video is still processing, continuing with form submission");
        // Ensure muxPlaybackId is an empty string (not null or undefined)
        data.muxPlaybackId = "";
        console.log("Set muxPlaybackId to empty string:", data);
      }
      
      // Continue with form submission
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create lesson');
      }
      
      const lesson = await response.json();
      
      if (isVideoProcessing) {
        toast({
          title: "Lesson created",
          description: "Your lesson has been created and the video is being processed. It will be available once processing is complete.",
        });
      } else {
        toast({
          title: "Lesson created",
          description: "Your lesson has been created successfully.",
        });
      }
      
      // Check if we need to redirect to the asset status page
      const assetId = window.sessionStorage.getItem('redirectToAssetStatus');
      if (assetId) {
        // Clear the flag
        window.sessionStorage.removeItem('redirectToAssetStatus');
        // Redirect to the asset status page
        router.push(`/lessons/asset/${assetId}`);
      } else {
        // Normal redirect to the lesson page
        router.push(`/lessons/${lesson.id}`);
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lesson",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Lesson</h1>
      <LessonForm 
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
