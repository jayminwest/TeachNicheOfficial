'use client';

import { useAuth } from "@/app/services/auth/AuthContext";
import { canCreateLesson } from "@/app/services/user-restrictions";
import { LessonCreationRestriction } from "@/app/components/ui/lesson-creation-restriction";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CreatorDashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [loading, isAuthenticated, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          Loading...
        </div>
      </div>
    );
  }
  
  // Check if user can create lessons
  const canCreate = user?.metadata?.creationTime 
    ? canCreateLesson(user.metadata.creationTime) 
    : false;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Creator Dashboard</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Share your expertise and earn income by creating lessons on Teach Niche.
        </p>
        
        {!canCreate && (
          <LessonCreationRestriction className="mb-8" />
        )}
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Lesson</CardTitle>
              <CardDescription>
                Share your knowledge and expertise with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create engaging video lessons and earn 85% of each sale.</p>
            </CardContent>
            <CardFooter>
              <Button asChild disabled={!canCreate}>
                <Link href="/lessons/new">Create Lesson</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Manage Your Content</CardTitle>
              <CardDescription>
                View and edit your existing lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Track performance, update content, and manage your published lessons.</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/profile?tab=content">Manage Content</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Creator Resources</CardTitle>
              <CardDescription>
                Tips and guidelines to help you succeed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Keep your lessons focused on specific skills or techniques</li>
                <li>Use clear, high-quality video with good lighting and audio</li>
                <li>Break complex topics into manageable sections</li>
                <li>Provide downloadable resources when applicable</li>
                <li>Engage with student questions and feedback</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
