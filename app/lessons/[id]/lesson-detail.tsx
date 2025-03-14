'use client';

import { VideoPlayer } from "@/app/components/ui/video-player";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft, PencilIcon } from "lucide-react";
import { LessonAccessGate } from "@/app/components/ui/lesson-access-gate";
import Link from "next/link";
import { Toaster } from "@/app/components/ui/toaster";
import { useEffect, useState } from "react";

interface LessonDetailProps {
  id: string;
  session?: {
    user?: {
      id: string;
    };
  } | null;
  initialLesson?: any;
}

export default function LessonDetail({ id, session, initialLesson }: LessonDetailProps) {
  const [lesson, setLesson] = useState(initialLesson);
  const [loading, setLoading] = useState(!initialLesson);
  const [error, setError] = useState<string | null>(null);
  const [playbackToken, setPlaybackToken] = useState<string | null>(null);
  const [thumbnailToken, setThumbnailToken] = useState<string | null>(null);
  const [storyboardToken, setStoryboardToken] = useState<string | null>(null);

  // Redirect to new lesson page if the ID is "create"
  useEffect(() => {
    if (id === "create") {
      window.location.href = '/lessons/new';
      return;
    }

    // If we don't have the initial lesson data, fetch it
    if (!initialLesson && id) {
      fetchLesson();
    }
  }, [id, initialLesson]);

  // Check if the playback ID is for a signed URL and fetch token if needed
  useEffect(() => {
    if (lesson?.mux_playback_id) {
      const isSignedPlaybackId = lesson.mux_playback_id.includes('_') || false;
      
      if (isSignedPlaybackId && !playbackToken) {
        const fetchPlaybackToken = async () => {
          try {
            console.log('Fetching token for playback ID:', lesson.mux_playback_id);
            const response = await fetch(`/api/mux/token?playbackId=${lesson.mux_playback_id}`);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Failed to fetch playback token:', response.status, errorText);
              setError(`Failed to load video playback token: ${response.status}`);
              return;
            }
            
            const data = await response.json();
            console.log('Token received successfully');
            setPlaybackToken(data.token);
            setThumbnailToken(data.thumbnailToken);
            setStoryboardToken(data.storyboardToken);
          } catch (err) {
            console.error('Error fetching playback token:', err);
            setError('Error loading video playback token');
          }
        };
        
        fetchPlaybackToken();
      }
    }
  }, [lesson?.mux_playback_id, playbackToken]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lessons/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch lesson');
      }
      
      const data = await response.json();
      setLesson(data);
      
      // If we have an asset ID but no playback ID, get it from Mux
      if (data.mux_asset_id && !data.mux_playback_id) {
        const muxResponse = await fetch(`/api/mux/playback-id?assetId=${data.mux_asset_id}`);
        const muxResult = await muxResponse.json();
        
        if (muxResponse.ok && muxResult.playbackId) {
          setLesson(prev => ({
            ...prev,
            mux_playback_id: muxResult.playbackId
          }));
          
          // Update the playback ID in the database
          await fetch(`/api/lessons/${id}/update-playback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ playbackId: muxResult.playbackId })
          });
        }
      }
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError('Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl px-4 py-10">
          <Link href="/lessons">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lessons
            </Button>
          </Link>
          <p className="text-destructive">{error || "Lesson not found or not available. It may have been removed or is not yet published."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link href="/lessons">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lessons
              </Button>
            </Link>
        
            {/* Show edit button for lesson owner */}
            {session?.user?.id === lesson.creator_id && (
              <Link href={`/lessons/${lesson.id}/edit`}>
                <Button variant="outline">
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit Lesson
                </Button>
              </Link>
            )}
          </div>
        
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {lesson.title}
          </h1>
          {lesson.mux_playback_id && (
            <div className="mb-6">
              {lesson.price === 0 ? (
                // For free lessons, show the video player directly
                <VideoPlayer
                  playbackId={lesson.mux_playback_id}
                  title={lesson.title}
                  className="w-full aspect-video rounded-lg overflow-hidden"
                  playbackToken={playbackToken}
                  thumbnailToken={thumbnailToken}
                  storyboardToken={storyboardToken}
                />
              ) : (
                // For paid lessons, keep the access gate
                <LessonAccessGate
                  lessonId={lesson.id}
                  creatorId={lesson.creator_id}
                  price={lesson.price}
                  className="w-full"
                >
                  <VideoPlayer
                    playbackId={lesson.mux_playback_id}
                    title={lesson.title}
                    className="w-full aspect-video rounded-lg overflow-hidden"
                    playbackToken={playbackToken}
                    thumbnailToken={thumbnailToken}
                    storyboardToken={storyboardToken}
                  />
                </LessonAccessGate>
              )}
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
