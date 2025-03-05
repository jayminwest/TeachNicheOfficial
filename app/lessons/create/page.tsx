"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LessonForm } from "@/app/components/ui/lesson-form";
import { toast } from "@/app/components/ui/use-toast";

export default function CreateLessonPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      console.log("Form submission data:", data);
      
      // If we have an asset ID but no playback ID, the video is still processing
      // We should still allow the form to be submitted
      const isVideoProcessing = data.muxAssetId && (!data.muxPlaybackId || data.muxPlaybackId === "processing");
      
      if (isVideoProcessing) {
        console.log("Video is still processing, continuing with form submission");
        // Set an empty string for muxPlaybackId to ensure it's included in the request
        data.muxPlaybackId = "";
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
      
      // Redirect to the lesson page
      router.push(`/lessons/${lesson.id}`);
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
