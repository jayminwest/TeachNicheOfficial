import LessonDetail from "./lesson-detail";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

// Define the props type using the Next.js convention
type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function Page(props: PageProps) {
  // Access the id directly from params
  const lessonId = props.params.id;
  // We're not using the redirect parameter yet, but keeping it for future use
  // const redirect = searchParams?.redirect || null;
  
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
