'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/services/supabase';
import { LessonCard } from '@/app/components/ui/lesson-card';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  averageRating: number;
  totalRatings: number;
}

// Define the shape of the data returned from the database
interface PurchasedLessonData {
  lessons: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    mux_playback_id: string;
    created_at: string;
  };
  lesson_id: string;
}

export default function MyLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPurchasedLessons() {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/login?redirect=/my-lessons');
          return;
        }
        
        console.log('Session found, fetching purchased lessons');
        
        // Fetch purchased lessons
        const { data, error } = await supabase
          .from('purchases')
          .select(`
            lesson_id,
            lessons:lesson_id (
              id,
              title,
              description,
              price,
              mux_playback_id,
              created_at
            )
          `)
          .eq('user_id', session.user.id)
          .eq('status', 'completed');
        
        if (error) {
          throw new Error(error.message);
        }
        
        // Transform data to match the expected format
        const purchasedLessons: Lesson[] = data.map((purchase: PurchasedLessonData) => ({
          id: purchase.lessons.id,
          title: purchase.lessons.title,
          description: purchase.lessons.description || '', // Handle null descriptions
          price: purchase.lessons.price,
          thumbnailUrl: '/placeholder-lesson.jpg', // Replace with actual thumbnail URL
          averageRating: 4.5, // Mock data, replace with actual rating
          totalRatings: 10, // Mock data, replace with actual count
        }));
        
        console.log('Purchased lessons:', purchasedLessons);
        setLessons(purchasedLessons);
        
        // For testing purposes, if no lessons were found, add a mock lesson
        if (purchasedLessons.length === 0 && process.env.NODE_ENV === 'development') {
          console.log('No purchased lessons found, adding mock lesson for testing');
          setLessons([{
            id: 'mock-lesson-id',
            title: 'Test Lesson',
            description: 'This is a test lesson',
            price: 9.99,
            thumbnailUrl: '/placeholder-lesson.jpg',
            averageRating: 4.5,
            totalRatings: 10
          }]);
        }
      } catch (err) {
        console.error('Error fetching purchased lessons:', err);
        setError('Failed to load your lessons. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPurchasedLessons();
  }, [router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-2xl font-bold mb-8">My Lessons</h1>
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-pulse">Loading your lessons...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-2xl font-bold mb-8">My Lessons</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-2xl font-bold mb-8">My Lessons</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-6">You haven&apos;t purchased any lessons yet.</p>
          <Button asChild>
            <Link href="/lessons">Browse Lessons</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-2xl font-bold mb-8">My Lessons</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="lesson-grid">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
