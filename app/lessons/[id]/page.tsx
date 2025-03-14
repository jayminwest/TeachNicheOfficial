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
  // Instead of destructuring, we'll pass the entire params object to a helper function
  // that will handle the lesson ID extraction
  
  try {
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get session
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    // Return the lesson detail component with the full params object
    return <LessonDetail id={params.id} session={session} />;
  } catch (error) {
    console.error('Error in lesson page:', error);
    notFound();
    return null;
  }
  
  // The try-catch block is now moved up in the function
}
