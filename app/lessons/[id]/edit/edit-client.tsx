'use client';

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LessonForm } from "@/app/components/ui/lesson-form";
import { useRouter } from "next/navigation";
import { toast } from "@/app/components/ui/use-toast";

interface EditLessonClientProps {
  lessonId: string;
  session: any;
  initialLesson: any;
}

export default function EditLessonClient({ lessonId, session, initialLesson }: EditLessonClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update lesson');
      }
      
      const updatedLesson = await response.json();
      
      toast({
        title: "Lesson updated",
        description: "Your lesson has been successfully updated.",
      });
      
      // Redirect to the lesson page
      router.push(`/lessons/${lessonId}`);
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update lesson",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!initialLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10">
          <Link href={`/lessons/${lessonId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lesson
            </Button>
          </Link>
          <p className="text-destructive">Lesson not found or you don't have permission to edit it.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl px-4 py-10">
        <Link href={`/lessons/${lessonId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lesson
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold mb-6">Edit Lesson</h1>
        
        <LessonForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isEditing={true}
          defaultValues={{
            title: initialLesson.title,
            description: initialLesson.description,
            content: initialLesson.content,
            price: initialLesson.price,
            muxAssetId: initialLesson.mux_asset_id,
            muxPlaybackId: initialLesson.mux_playback_id,
          }}
        />
      </div>
    </div>
  );
}
