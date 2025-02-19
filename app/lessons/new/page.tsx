"use client";

import { LessonForm } from "@/components/ui/lesson-form";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewLessonPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    muxAssetId?: string;
    price?: number;
  }) => {
    setIsSubmitting(true);
    try {
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

      const session = await supabase.auth.getSession();
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
          "Authorization": `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify(data),
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
