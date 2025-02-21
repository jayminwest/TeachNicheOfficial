import { VideoPlayer } from "@/app/components/ui/video-player";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/app/services/supabase";
import { Toaster } from "@/app/components/ui/toaster";

interface LessonDetailProps {
  id: string;
}

export default async function LessonDetail({ id }: LessonDetailProps) {
  // Redirect to new lesson page if the ID is "create"
  if (id === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10">
          <p className="text-muted-foreground">Redirecting to new lesson page...</p>
          {/* Add client-side redirect since this is a server component */}
          <script
            dangerouslySetInnerHTML={{
              __html: `window.location.href = '/lessons/new'`
            }}
          />
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10">
          <Link href="/lessons">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lessons
            </Button>
          </Link>
          <p className="text-destructive">Invalid lesson ID.</p>
        </div>
      </div>
    );
  }

  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching lesson:', {
        message: error.message,
        details: error.details,
        code: error.code
      });
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
          <div className="container max-w-4xl px-4 py-10">
            <Link href="/lessons">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lessons
              </Button>
            </Link>
            <p className="text-destructive">Error loading lesson. Please try again later.</p>
          </div>
        </div>
      );
    }

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
            <p className="text-muted-foreground">Lesson not found or not available. It may have been removed or is not yet published.</p>
          </div>
        </div>
      );
    }

  // If we have an asset ID but no playback ID, get it from Mux
  if (lesson.mux_asset_id && !lesson.mux_playback_id) {
    const response = await fetch(`/api/mux/playback-id?assetId=${lesson.mux_asset_id}`);
    const result = await response.json();
    
    if (response.ok && result.playbackId) {
      lesson.mux_playback_id = result.playbackId;
      await supabase
        .from('lessons')
        .update({ mux_playback_id: result.playbackId })
        .eq('id', lesson.id);
    }
  }

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
                  id="lesson-video"
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
  } catch (error) {
    console.error('Unexpected error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10">
          <Link href="/lessons">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lessons
            </Button>
          </Link>
          <p className="text-destructive">An unexpected error occurred. Please try again later.</p>
        </div>
      </div>
    );
  }
}
