'use client';

import { useEffect, useState } from 'react';
import { Lesson } from '@/types/lesson';
import { createClientSupabaseClient } from '@/app/lib/supabase/client';

export default function LessonsClient() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchLessons() {
      try {
        setLoading(true);
        const supabase = createClientSupabaseClient();
        
        // Get filter parameters from URL if needed
        // Using window.location instead of useSearchParams
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        
        let query = supabase.from('lessons').select('*');
        
        if (category) {
          query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setLessons(data as Lesson[]);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchLessons();
    
    // Add event listener for URL changes
    const handleUrlChange = () => {
      fetchLessons();
    };
    
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-center items-center min-h-[200px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-md">
        {error}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No lessons found.</p>
        <p className="mt-2">
          <a href="/lessons/new" className="text-primary hover:underline">Create your first lesson</a>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="bg-card rounded-lg shadow-sm border overflow-hidden">
          <div className="aspect-video bg-muted relative">
            {lesson.thumbnailUrl ? (
              <img 
                src={lesson.thumbnailUrl} 
                alt={lesson.title} 
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-muted-foreground/50"><path d="M15 8h.01"></path><rect width="16" height="16" x="4" y="4" rx="3"></rect><path d="M4 15l4-4a3 5 0 0 1 3 0l5 5"></path><path d="M14 14l1-1a3 5 0 0 1 3 0l2 2"></path></svg>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 truncate">{lesson.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{lesson.description}</p>
            <div className="flex justify-between items-center">
              <span className="font-medium">${lesson.price.toFixed(2)}</span>
              <a 
                href={`/lessons/${lesson.id}`}
                className="text-primary hover:underline text-sm"
              >
                View Details
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
