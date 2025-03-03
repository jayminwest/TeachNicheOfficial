import LessonDetail from "./lesson-detail";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

 // eslint-disable-next-line @typescript-eslint/no-explicit-any                    
export default async function Page({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  const supabase = createServerSupabaseClient();
  
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
  
  return <LessonDetail id={params.id} />;
}
