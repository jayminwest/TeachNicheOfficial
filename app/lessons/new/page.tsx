"use client";

import { LessonForm } from "@/components/ui/lesson-form";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function NewLessonPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create lesson");
      }

      const lesson = await response.json();
      
      toast({
        title: "Success",
        description: "Lesson created successfully",
      });

      router.push(`/lessons/${lesson.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create lesson",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8">Create New Lesson</h1>
      <LessonForm onSubmit={handleSubmit} />
    </div>
  );
}
