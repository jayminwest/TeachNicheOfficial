import { Suspense } from 'react';
import LessonPageClient from './page-client';
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

// Simple metadata function
export const metadata: Metadata = {
  title: 'Lesson Details',
  description: 'View lesson details and content',
};

// Generate the lesson page with the ID from the URL segment
export default async function LessonPage({ params }: { params: { id: string } }) {
  try {
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get session
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    // Extract the ID from params and store it in a variable
    const lessonId = String(params?.id || '');
    
    // Use a Suspense boundary and pass the ID as a prop to the client component
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
        <LessonPageClient lessonId={lessonId} session={session} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error in lesson page:', error);
    notFound();
    return null;
  }
}
