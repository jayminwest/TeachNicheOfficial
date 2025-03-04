import LessonDetail from "./lesson-detail";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function Page({ params }) {
  const supabase = await createServerSupabaseClient();
  
  try {
    // Check if the lesson exists before rendering the component
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', params.id)
      .single();
    
    // If lesson doesn't exist, show 404 page
    if (error || !lesson) {
      notFound();
    }
    
    // Get the user session if available
    const { data: { session } } = await supabase.auth.getSession();
    
    return <LessonDetail id={params.id} session={session} />;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    notFound();
  }
}
