"use client";

import { useEffect, useState } from "react";
import { VideoPlayer } from "@/components/ui/video-player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  content?: string;
  status: string;
  mux_asset_id?: string;
  mux_playback_id?: string;
  created_at: string;
  creator_id: string;
  version: number;
}

export default function LessonPage({ params }: { params: { id: string } }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchLesson() {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Lesson not found');
        
        setLesson(data);
      } catch (error) {
        console.error('Error fetching lesson:', error);
        toast({
          title: "Error",
          description: "Failed to load lesson. Please try again.",
          variant: "destructive",
        });
        router.push('/lessons');
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <div className="mb-6">
          <Link href="/lessons">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lessons
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {lesson.title}
          </h1>
          {lesson.mux_playback_id && (
            <div className="mb-6">
              <VideoPlayer
                playbackId={lesson.mux_playback_id}
                title={lesson.title}
                className="w-full aspect-video rounded-lg overflow-hidden"
              />
            </div>
          )}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{lesson.description}</p>
              </div>
              {lesson.content && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Content</h2>
                  <div className="prose max-w-none dark:prose-invert">
                    {lesson.content}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Version {lesson.version}
                </div>
                <div className="font-medium">
                  {lesson.price === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>${lesson.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
