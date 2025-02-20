"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  created_at: string;
  // Add other fields as needed once we see the API implementation
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLessons(data || []);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        toast({
          title: "Error",
          description: "Failed to load lessons. Please try again.",
          variant: "destructive",
        });
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
            <h3 className="font-semibold mb-2">No lessons yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first lesson
            </p>
            <Link href="/lessons/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Lesson
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {lesson.description}
                    </p>
                    <div className="text-sm font-medium">
                      {lesson.price === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>${lesson.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
