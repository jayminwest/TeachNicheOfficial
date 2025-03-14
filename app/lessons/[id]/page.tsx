import LessonDetail from "./lesson-detail";
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
    
    // Pass the ID directly to the component without accessing it as a variable
    return <LessonDetail id={String(params?.id || '')} session={session} />;
  } catch (error) {
    console.error('Error in lesson page:', error);
    notFound();
    return null;
  }
}
