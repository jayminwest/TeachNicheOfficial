"use client";

import { LessonForm } from "@/app/components/ui/lesson-form";
import { toast } from "@/app/components/ui/use-toast";
import { Toaster } from "@/app/components/ui/toaster";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/app/services/supabase";
import { useAuth } from "@/app/services/auth/AuthContext";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  
  // Fetch lesson data
  useEffect(() => {
    async function fetchLesson() {
      if (!lessonId) return;
      
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();
        
        if (error) throw error;
        
        // Check ownership
        if (user && data.instructor_id !== user.id) {
          setError('You do not have permission to edit this lesson');
          setIsLoading(false);
          return;
        }
        
        setLesson(data);
      } catch (error) {
        console.error('Error fetching lesson:', error);
        setError('Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (!authLoading && user) {
      fetchLesson();
    } else if (!authLoading && !user) {
      setError('Please sign in to edit lessons');
      setIsLoading(false);
    }
  }, [lessonId, user, authLoading]);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    content: string;
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
          description: "Please sign in to update this lesson",
          variant: "destructive",
        });
        setIsSubmitting(false);
        router.push(`/sign-in?redirect=/lessons/${lessonId}/edit`);
        return;
      }
      
      // Update the lesson
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || 
          errorData.message || 
          `Failed to update lesson: ${response.statusText}`
        );
      }

      const updatedLesson = await response.json();
      
      toast({
        title: "Lesson Updated!",
        description: "Your lesson has been updated successfully.",
      });

      router.push(`/lessons/${updatedLesson.id}`);
    } catch (error) {
      console.error('Lesson update error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "There was an error updating your lesson. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10">
          <Link href={`/lessons/${lessonId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lesson
            </Button>
          </Link>
          <div className="p-6 bg-destructive/10 rounded-lg">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show not found state
  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10">
          <Link href="/lessons">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lessons
            </Button>
          </Link>
          <p className="text-muted-foreground">Lesson not found or not available.</p>
        </div>
      </div>
    );
  }

  // Prepare form initial data
  const initialData = {
    title: lesson.title,
    description: lesson.description || '',
    content: lesson.content || '',
    price: lesson.price || 0,
    muxAssetId: lesson.mux_asset_id || '',
    muxPlaybackId: lesson.mux_playback_id || '',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <div className="mb-6">
          <Link href={`/lessons/${lessonId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lesson
            </Button>
          </Link>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Edit Lesson
            </h1>
            <p className="text-muted-foreground">
              Update your lesson content and settings.
            </p>
          </div>
          <div className="bg-card rounded-lg border shadow-sm p-6 md:p-8">
            <LessonForm 
              initialData={initialData} 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting}
              isEditing={true}
            />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
