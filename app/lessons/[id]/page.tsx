import LessonDetail from "./lesson-detail";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function Page({ params }: PageProps) {
  // Store params.id in a local variable for clarity
  const lessonId = params.id;
  
  const supabase = await createServerSupabaseClient();
  
  try {
    // Check if the lesson exists before rendering the component
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    
    // If lesson doesn't exist, show 404 page
    if (error || !lesson) {
      notFound();
    }
    
    // Get the user session if available
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    // Return the component with props using the local lessonId variable
    return <LessonDetail id={lessonId} session={session} />;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    notFound();
  }
}
