import LessonDetail from "./lesson-detail";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

// Simple metadata function
export const metadata: Metadata = {
  title: 'Lesson Details',
  description: 'View lesson details and content',
};

// Simple page component that avoids complex typing
export default async function LessonPage(props: any) {
  // Get the lesson ID from the URL
  const lessonId = props.params?.id;
  
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
