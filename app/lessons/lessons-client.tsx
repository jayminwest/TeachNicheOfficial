'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Plus } from 'lucide-react';

export default function LessonsClient() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    async function fetchLessons() {
      try {
        const response = await fetch('/api/lessons');
        if (!response.ok) {
          throw new Error('Failed to fetch lessons');
        }
        const data = await response.json();
        setLessons(data);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLessons();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        {error}
      </div>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Lessons
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse and manage your lessons
          </p>
        </div>
        <Link href="/lessons/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Lesson
          </Button>
        </Link>
      </div>
      
      {lessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map(lesson => (
            <div key={lesson.id} className="bg-card rounded-lg border shadow-sm p-4">
              <h3 className="font-semibold mb-2">{lesson.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{lesson.description}</p>
              <Link href={`/lessons/${lesson.id}`}>
                <Button variant="outline" size="sm">
                  View Lesson
                </Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No lessons found</p>
          <Link href="/lessons/new">
            <Button>Create your first lesson</Button>
          </Link>
        </div>
      )}
    </>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';
import { LessonGrid } from '@/app/components/ui/lesson-grid';
import { Button } from '@/app/components/ui/button';
import { Loader2, Plus } from 'lucide-react';

export default function LessonsClient() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    async function fetchLessons() {
      try {
        const response = await fetch('/api/lessons');
        if (!response.ok) {
          throw new Error('Failed to fetch lessons');
        }
        const data = await response.json();
        setLessons(data);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLessons();
  }, []);
  
  const handleNewLesson = () => {
    router.push('/lessons/new');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        {error}
      </div>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Lessons
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse and manage your lessons
          </p>
        </div>
        {user && (
          <Button onClick={handleNewLesson}>
            <Plus className="mr-2 h-4 w-4" />
            New Lesson
          </Button>
        )}
      </div>
      
      {lessons.length > 0 ? (
        <LessonGrid lessons={lessons} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No lessons found</p>
          {user && (
            <Button onClick={handleNewLesson}>Create your first lesson</Button>
          )}
        </div>
      )}
    </>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';
import { LessonGrid } from '@/app/components/ui/lesson-grid';
import { Button } from '@/app/components/ui/button';
import { Loader2, Plus } from 'lucide-react';

export default function LessonsClient() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    async function fetchLessons() {
      try {
        const response = await fetch('/api/lessons');
        if (!response.ok) {
          throw new Error('Failed to fetch lessons');
        }
        const data = await response.json();
        setLessons(data);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLessons();
  }, []);
  
  const handleNewLesson = () => {
    router.push('/lessons/new');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        {error}
      </div>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Lessons
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse and manage your lessons
          </p>
        </div>
        {user && (
          <Button onClick={handleNewLesson}>
            <Plus className="mr-2 h-4 w-4" />
            New Lesson
          </Button>
        )}
      </div>
      
      {lessons.length > 0 ? (
        <LessonGrid lessons={lessons} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No lessons found</p>
          {user && (
            <Button onClick={handleNewLesson}>Create your first lesson</Button>
          )}
        </div>
      )}
    </>
  );
}
