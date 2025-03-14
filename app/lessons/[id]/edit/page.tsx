import { Suspense } from 'react';
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Metadata } from 'next';
import EditLessonClient from './edit-client';

// Simple metadata
export const metadata: Metadata = {
  title: 'Edit Lesson',
  description: 'Edit your lesson content',
};

// Generate the lesson edit page with the ID from the URL segment
export default function EditLessonPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded w-full"></div>
        </div>
      </div>
    }>
      <EditLessonContent params={params} />
    </Suspense>
  );
}

// Separate async component to handle data fetching
async function EditLessonContent({ params }: { params: { id: string } }) {
  try {
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get session
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (!session) {
      // Redirect to login if not authenticated
      return redirect('/auth?redirect=/lessons');
    }
    
    // Await the params object before accessing its properties
    const { id } = await params;
    
    // Check if the user is the owner of the lesson
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error || !lesson) {
      console.error('Error fetching lesson:', error);
      notFound();
      return null;
    }
    
    // Check if the user is the owner
    if (lesson.creator_id !== session.user.id) {
      // Redirect to lesson view if not the owner
      return redirect(`/lessons/${id}`);
    }
    
    return <EditLessonClient lessonId={id} session={session} initialLesson={lesson} />;
  } catch (error) {
    console.error('Error in edit lesson page:', error);
    notFound();
    return null;
  }
}
