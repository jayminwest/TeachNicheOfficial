import LessonDetail from "./lesson-detail";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

// Simple metadata function
export const metadata: Metadata = {
  title: 'Lesson Details',
  description: 'View lesson details and content',
};

export default async function LessonPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Create a wrapper component to handle the params
  return <LessonPageWrapper params={params} />;
}

// Create a separate async component to handle the data fetching
async function LessonPageWrapper({ params }: { params: { id: string } }) {
  try {
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get session
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    // Extract the ID here after the async operations
    const lessonId = params.id;
    
    // Return the lesson detail component
    return <LessonDetail id={lessonId} session={session} />;
  } catch (error) {
    console.error('Error in lesson page:', error);
    notFound();
    return null;
  }
}
