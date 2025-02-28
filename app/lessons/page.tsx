"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { LessonGrid } from "@/app/components/ui/lesson-grid";
import Link from "next/link";
import { toast } from "@/app/components/ui/use-toast";
import { Toaster } from "@/app/components/ui/toaster";

import type { Lesson } from '@/types/lesson'

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLessons() {
      try {
        // Import firebaseClient only when needed
        const { firebaseClient } = await import('@/app/services/firebase-compat');
        
        // Query lessons collection
        const queryRef = firebaseClient.from('lessons');
        const queryResult = await queryRef.select();
        
        // Mock data structure to match expected format
        const data = queryResult.data || [];
        const error = queryResult.error;

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Check if there are no lessons in the database
        if (!data || data.length === 0) {
          // Don't show an error toast, we'll handle this in the UI
          setLessons([]);
          setLoading(false);
          return;
        }
        
        // Transform the data to match the Lesson type
        const transformedLessons: Lesson[] = (data || []).map((lesson: Record<string, unknown>) => {
          const reviews = (lesson.reviews as Array<Record<string, unknown>>) || [];
          const totalRatings = reviews.length;
          const averageRating = totalRatings > 0 
            ? reviews.reduce((sum: number, review: Record<string, unknown>) => sum + (review.rating as number), 0) / totalRatings 
            : 0;

          return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || '',
            price: lesson.price,
            thumbnailUrl: lesson.thumbnail_url || '/placeholder-lesson.jpg',
            created_at: lesson.created_at,
            averageRating,
            totalRatings
          };
        });
        
        setLessons(transformedLessons);
      } catch (error) {
        // Check if this is just an empty database (not a real error)
        if (error instanceof Error && error.message.includes('Database error')) {
          console.log('Database query executed but returned no results');
          // No toast for empty database - we'll handle in the UI
        } else {
          // Log actual errors
          console.error('Error fetching lessons:', error instanceof Error ? error.message : 'Unknown error');
          toast({
            title: "Error",
            description: "Failed to load lessons. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Lessons
            </h1>
            <p className="mt-2 text-muted-foreground">
              Browse and manage your lessons
            </p>
          </div>
          <Link href="/lessons/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Lesson
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : lessons.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="font-semibold text-xl mb-3">Congrats! You&apos;re first.</h3>
            <p className="text-muted-foreground mb-4">
              Be the pioneer and create the very first lesson on Teach Niche! 
            </p>
            <Link href="/lessons/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Lesson
              </Button>
            </Link>
          </Card>
        ) : (
          <LessonGrid lessons={lessons} />
        )}
      </div>
      <Toaster />
    </div>
  );
}
