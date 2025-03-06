import { Suspense } from 'react';
import LessonDetail from "./lesson-detail";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from 'next';
import { PageProps, MetadataProps } from '@/app/types/next';

// Add metadata generation for the page
export async function generateMetadata({ 
  params 
}: MetadataProps): Promise<Metadata> {
  const lessonId = params.id;
  
  try {
    const supabase = await createServerSupabaseClient();
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('title, description')
      .eq('id', lessonId)
      .single();
    
    if (error) {
      console.error('Error fetching lesson metadata:', error);
      return {
        title: 'Lesson Details',
        description: 'View lesson details and content'
      };
    }
    
    return {
      title: lesson?.title || 'Lesson Details',
      description: lesson?.description || 'View lesson details and content'
    };
  } catch (err) {
    console.error('Error generating metadata:', err);
    return {
      title: 'Lesson Details',
      description: 'View lesson details and content'
    };
  }
}

// Define the page component with proper Next.js types
export default async function Page({
  params,
}: PageProps) {
  // Access the id directly from params
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
    // Wrap any client components that might use useSearchParams in Suspense
    return (
      <Suspense fallback={
        <div className="container mx-auto p-4">
          <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded-md mb-4"></div>
          <div className="h-64 w-full bg-muted animate-pulse rounded-md"></div>
        </div>
      }>
        <LessonDetail id={lessonId} session={session} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching lesson:', error);
    notFound();
  }
}
