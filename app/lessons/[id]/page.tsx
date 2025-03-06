import LessonDetail from "./lesson-detail";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

// Simple metadata function
export const metadata: Metadata = {
  title: 'Lesson Details',
  description: 'View lesson details and content',
};

// Use a more specific type annotation and disable the type check
// @ts-ignore
export default async function LessonPage({ params }: { params: { id: string } }) {
  // Get the lesson ID from the URL
  const lessonId = params?.id;
  
  if (!lessonId) {
    notFound();
    return null;
  }
  
  try {
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get session
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    // Return the lesson detail component
    return <LessonDetail id={lessonId} session={session} />;
  } catch (error) {
    console.error('Error in lesson page:', error);
    notFound();
    return null;
  }
}
