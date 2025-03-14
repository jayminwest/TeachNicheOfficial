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
export default function LessonPage(props: { params: { id: string } }) {
  // Create a static ID string to avoid accessing params.id directly
  const idString = props.params?.id || '';
  
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
      <LessonPageContent idString={idString} />
    </Suspense>
  );
}

// Separate async component to handle data fetching
async function LessonPageContent({ idString }: { idString: string }) {
  try {
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get session
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    return <LessonPageClient lessonId={idString} session={session} />;
  } catch (error) {
    console.error('Error in lesson page:', error);
    notFound();
    return null;
  }
}
